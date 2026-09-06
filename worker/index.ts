/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const CARWALE_SOURCE_ID = "carwale-bengaluru";
const CARWALE_BASE = "https://www.carwale.com/used/bangalore/";
const CARWALE_QUERY = "segmentTypes=1&kms=0-&year=0-&budget=0-&so=-1&sc=-1";
const SPINNY_SOURCE_ID = "spinny-bengaluru";
const SPINNY_INVENTORY_URL = "https://www.spinny.com/used-luxury-cars-in-bangalore/s/";
const LUXURY_BRANDS = ["Mercedes-Benz", "BMW", "Audi", "Volvo", "Lexus", "Porsche", "Land Rover", "Jaguar", "Mini", "Maserati", "Bentley", "Rolls-Royce", "Ferrari", "Lamborghini"];
const ANALYTICS_EVENTS = new Set(["page_view", "finance_filter", "finance_plan_listing", "listing_open", "shortlist_add", "shortlist_remove", "shortlist_view", "source_filter", "sort_change"]);

type ImportedCar = { sourceListingId: string; url: string; imageUrl: string; title: string; location: string; price: number; kilometres: number; fuel: string; year: number; brand: string; model: string };

type SpinnyPayload = {
  results?: Array<{
    id: number; make: string; model: string; variant?: string; make_year: number; mileage: number; price: number;
    fuel_type?: string; transmission?: string; permanent_url?: string;
    without_bg_image?: { file?: { absurl?: string } };
  }>;
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(36);
}

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#x27;/g, "'").trim();
}

function parsePrice(value: string) {
  const amount = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return /crore/i.test(value) ? amount * 100 : amount;
}

function parseCarWalePage(html: string): ImportedCar[] {
  const cards = [...html.matchAll(/<li class="o-C o-jA[^>]*>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
  const records: ImportedCar[] = [];
  for (const card of cards) {
    const href = card.match(/href="(\/used\/bangalore\/[^\"]+\/[^\"]+\/)"/i)?.[1];
    const title = decode(card.match(/<h3[^>]*>([^<]+)<\/h3>/i)?.[1] ?? "");
    const location = decode(card.match(/<span[^>]*>([^<]*Bangalore)<\/span>/i)?.[1] ?? "");
    const imageUrl = decode(card.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? "");
    const priceText = decode(card.match(/<span[^>]*>(₹[^<]+)<\/span>/i)?.[1] ?? "");
    const details = location.match(/([\d,]+)\s*(?:km|किमी)[\s\S]*?\|\s*([^|]+)\|/i);
    const brand = LUXURY_BRANDS.find((candidate) => new RegExp(`^\\d{4} ${candidate.replace("-", "[- ]")}`, "i").test(title));
    if (!href || !title || !imageUrl || !priceText || !details || !brand || !/Bangalore/i.test(location)) continue;
    const year = Number.parseInt(title.slice(0, 4), 10);
    const modelWords = title.replace(/^\d{4}\s+/, "").replace(new RegExp(`^${brand.replace("-", "[- ]")}\\s+`, "i"), "").split(" ");
    const model = brand === "Land Rover" && modelWords.slice(0, 2).join(" ").toLowerCase() === "range rover" ? modelWords.slice(0, 3).join(" ") : modelWords[0];
    records.push({ sourceListingId: href.split("/").filter(Boolean).at(-1)!, url: `https://www.carwale.com${href}`, imageUrl, title, location, price: parsePrice(priceText), kilometres: Number.parseInt(details[1].replace(/,/g, ""), 10), fuel: details[2].trim(), year, brand, model });
  }
  return records;
}

function parseCarWaleStocks(payload: { stocks?: Array<Record<string, unknown>> }): ImportedCar[] {
  const records: ImportedCar[] = [];
  for (const stock of payload.stocks ?? []) {
    const title = String(stock.carName ?? "");
    const href = String(stock.url ?? "");
    const brand = LUXURY_BRANDS.find((candidate) => new RegExp(`^${candidate.replace("-", "[- ]")}\\s`, "i").test(title));
    const year = Number(stock.makeYear);
    if (!brand || !href || !Number.isFinite(year) || !/Bangalore/i.test(String(stock.cityName ?? ""))) continue;
    const modelWords = title.replace(new RegExp(`^${brand.replace("-", "[- ]")}\\s+`, "i"), "").split(" ");
    const model = brand === "Land Rover" && modelWords.slice(0, 2).join(" ").toLowerCase() === "range rover" ? modelWords.slice(0, 3).join(" ") : modelWords[0];
    records.push({
      sourceListingId: href.split("/").filter(Boolean).at(-1)!,
      url: `https://www.carwale.com${href}`,
      imageUrl: String(stock.imageUrl ?? ""),
      title,
      location: String(stock.cityName),
      price: Number(stock.priceNumeric) / 100000,
      kilometres: Number(stock.kmNumeric),
      fuel: String(stock.fuel ?? ""),
      year,
      brand,
      model,
    });
  }
  return records;
}

async function importCarWale(env: Env) {
  const now = new Date().toISOString();
  const runId = `run-${crypto.randomUUID()}`;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM listing_sources WHERE source_id = ?").bind(CARWALE_SOURCE_ID),
    env.DB.prepare("DELETE FROM listings WHERE id NOT IN (SELECT DISTINCT listing_id FROM listing_sources)"),
    env.DB.prepare("INSERT INTO sources (id, name, city, inventory_url, is_enabled) VALUES (?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET is_enabled = 1").bind(CARWALE_SOURCE_ID, "CarWale", "Bengaluru", `${CARWALE_BASE}?${CARWALE_QUERY}`),
    env.DB.prepare("INSERT INTO import_runs (id, source_id, status, started_at) VALUES (?, ?, ?, ?)").bind(runId, CARWALE_SOURCE_ID, "running", now),
  ]);
  let pagesRead = 0;
  let listingsSeen = 0;
  let nextPageUrl = `/api/stocks/?pn=1&budget=0-&city=2&kms=0-&ps=24&sc=-1&so=-1&segmentTypes=1&year=0-&lcr=0&shouldfetchnearbycars=False&stockfetched=0`;
  for (let page = 1; page <= 44 && nextPageUrl; page += 1) {
    const response = await fetch(`https://www.carwale.com${nextPageUrl}`, { headers: { "User-Agent": "Driveworthy market research" } });
    if (!response.ok) break;
    const payload = await response.json<{ stocks?: Array<Record<string, unknown>>; nextPageUrl?: string | null }>();
    const cars = parseCarWaleStocks(payload);
    if (!cars.length) break;
    nextPageUrl = payload.nextPageUrl ?? "";
    pagesRead += 1;
    listingsSeen += cars.length;
    const statements: D1PreparedStatement[] = [];
    for (const car of cars) {
      // A marketplace can contain several distinct cars with the same model,
      // year and advertised kilometres. Keep those records separate here;
      // cross-site reposts are grouped in the dashboard with a more cautious
      // matching rule.
      const fingerprint = `${CARWALE_SOURCE_ID}|${car.sourceListingId}`;
      const listingId = `vehicle-${hash(fingerprint)}`;
      statements.push(
        env.DB.prepare("INSERT INTO listings (id, fingerprint, brand, model, year, kilometres, fuel, price_lakh, image_url, status, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?) ON CONFLICT(fingerprint) DO UPDATE SET price_lakh = excluded.price_lakh, image_url = excluded.image_url, last_seen_at = excluded.last_seen_at, status = 'available'").bind(listingId, fingerprint, car.brand, car.model, car.year, car.kilometres, car.fuel, car.price, car.imageUrl, now, now),
        env.DB.prepare("INSERT INTO listing_sources (id, listing_id, source_id, source_listing_id, source_url, asking_price_lakh, seen_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(source_id, source_listing_id) DO UPDATE SET asking_price_lakh = excluded.asking_price_lakh, seen_at = excluded.seen_at").bind(`source-${hash(`${CARWALE_SOURCE_ID}|${car.sourceListingId}`)}`, listingId, CARWALE_SOURCE_ID, car.sourceListingId, car.url, car.price, now),
      );
    }
    await env.DB.batch(statements);
  }
  await env.DB.batch([
    env.DB.prepare("UPDATE sources SET last_completed_at = ? WHERE id = ?").bind(now, CARWALE_SOURCE_ID),
    env.DB.prepare("UPDATE import_runs SET status = 'completed', pages_read = ?, listings_seen = ?, completed_at = ? WHERE id = ?").bind(pagesRead, listingsSeen, now, runId),
  ]);
  return { pagesRead, listingsSeen };
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function importSpinny(env: Env) {
  const now = new Date().toISOString();
  const runId = `run-${crypto.randomUUID()}`;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM listing_sources WHERE source_id = ?").bind(SPINNY_SOURCE_ID),
    env.DB.prepare("DELETE FROM listings WHERE id NOT IN (SELECT DISTINCT listing_id FROM listing_sources)"),
    env.DB.prepare("INSERT INTO sources (id, name, city, inventory_url, is_enabled) VALUES (?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET is_enabled = 1").bind(SPINNY_SOURCE_ID, "Spinny", "Bengaluru", SPINNY_INVENTORY_URL),
    env.DB.prepare("INSERT INTO import_runs (id, source_id, status, started_at) VALUES (?, ?, ?, ?)").bind(runId, SPINNY_SOURCE_ID, "running", now),
  ]);

  const response = await fetch("https://api.spinny.com/v3/api/listing/v7/?city=bangalore&page=1&page_size=100&availability=available&car_category=luxury", {
    headers: { "User-Agent": "Driveworthy market research", Accept: "application/json" },
  });
  if (!response.ok) {
    await env.DB.prepare("UPDATE import_runs SET status = 'failed', completed_at = ?, message = ? WHERE id = ?").bind(now, `Spinny returned ${response.status}`, runId).run();
    throw new Error(`Spinny returned ${response.status}`);
  }

  const payload = await response.json<SpinnyPayload>();
  const cars = (payload.results ?? []).flatMap((car) => {
    const brand = LUXURY_BRANDS.find((candidate) => candidate.toLowerCase() === car.make.toLowerCase());
    const imagePath = car.without_bg_image?.file?.absurl;
    if (!brand || !car.id || !car.model || !car.make_year || !car.price || !imagePath) return [];
    return [{
      sourceListingId: String(car.id),
      url: `https://www.spinny.com${car.permanent_url ?? `/buy-used-cars/bangalore/${car.id}/`}`,
      imageUrl: imagePath.startsWith("//") ? `https:${imagePath}` : imagePath,
      title: `${car.make_year} ${brand} ${car.model}`,
      location: "Bengaluru",
      price: car.price / 100000,
      kilometres: car.mileage,
      fuel: titleCase(car.fuel_type ?? ""),
      year: car.make_year,
      brand,
      model: car.model,
    } satisfies ImportedCar];
  });

  const statements: D1PreparedStatement[] = [];
  for (const car of cars) {
    const fingerprint = `${SPINNY_SOURCE_ID}|${car.sourceListingId}`;
    const listingId = `vehicle-${hash(fingerprint)}`;
    statements.push(
      env.DB.prepare("INSERT INTO listings (id, fingerprint, brand, model, year, kilometres, fuel, price_lakh, image_url, status, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?) ON CONFLICT(fingerprint) DO UPDATE SET price_lakh = excluded.price_lakh, image_url = excluded.image_url, last_seen_at = excluded.last_seen_at, status = 'available'").bind(listingId, fingerprint, car.brand, car.model, car.year, car.kilometres, car.fuel, car.price, car.imageUrl, now, now),
      env.DB.prepare("INSERT INTO listing_sources (id, listing_id, source_id, source_listing_id, source_url, asking_price_lakh, seen_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(source_id, source_listing_id) DO UPDATE SET asking_price_lakh = excluded.asking_price_lakh, seen_at = excluded.seen_at").bind(`source-${hash(`${SPINNY_SOURCE_ID}|${car.sourceListingId}`)}`, listingId, SPINNY_SOURCE_ID, car.sourceListingId, car.url, car.price, now),
    );
  }
  if (statements.length) await env.DB.batch(statements);
  await env.DB.batch([
    env.DB.prepare("UPDATE sources SET last_completed_at = ? WHERE id = ?").bind(now, SPINNY_SOURCE_ID),
    env.DB.prepare("UPDATE import_runs SET status = 'completed', pages_read = 1, listings_seen = ?, completed_at = ? WHERE id = ?").bind(cars.length, now, runId),
  ]);
  return { pagesRead: 1, listingsSeen: cars.length };
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const isCarWaleImportRoute = url.pathname === "/api/import/carwale";
    const isSpinnyImportRoute = url.pathname === "/api/import/spinny";
    const isMarketRefreshRoute = url.pathname === "/api/market-refresh" || url.pathname === "/market-refresh";

    if (isMarketRefreshRoute && (request.method === "POST" || url.searchParams.get("run") === "1")) {
      const [carwale, spinny] = await Promise.all([importCarWale(env), importSpinny(env)]);
      return Response.json({ carwale, spinny });
    }

    if ((isCarWaleImportRoute || isSpinnyImportRoute) && (request.method === "POST" || url.searchParams.get("run") === "1")) {
      if (isSpinnyImportRoute) return Response.json(await importSpinny(env));
      return Response.json(await importCarWale(env));
    }

    if ((isCarWaleImportRoute || isSpinnyImportRoute) && request.method === "GET") {
      const sourceId = isSpinnyImportRoute ? SPINNY_SOURCE_ID : CARWALE_SOURCE_ID;
      const latest = await env.DB.prepare("SELECT status, pages_read, listings_seen, completed_at, message FROM import_runs WHERE source_id = ? ORDER BY started_at DESC LIMIT 1").bind(sourceId).first();
      return Response.json(latest ?? { status: "not_started" });
    }

    if (url.pathname === "/api/listings" && request.method === "GET") {
      const records = await env.DB.prepare("SELECT l.id, l.brand, l.model, l.variant, l.year, l.kilometres, l.fuel, l.transmission, l.price_lakh, l.image_url, l.last_seen_at, s.name AS source, ls.source_url AS source_url FROM listings l JOIN listing_sources ls ON ls.listing_id = l.id JOIN sources s ON s.id = ls.source_id WHERE l.status = 'available' ORDER BY l.last_seen_at DESC").all();
      return Response.json(records.results);
    }

    if (url.pathname === "/api/analytics" && request.method === "POST") {
      let payload: { event?: unknown; context?: unknown } = {};
      try { payload = await request.json(); } catch { return new Response(null, { status: 204 }); }
      const event = typeof payload.event === "string" ? payload.event : "";
      if (!ANALYTICS_EVENTS.has(event)) return new Response(null, { status: 204 });
      const context = typeof payload.context === "string" ? payload.context.replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 80) : "";
      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      await env.DB.prepare("INSERT INTO analytics_daily (day, event_name, context, count, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(day, event_name, context) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at")
        .bind(day, event, context, now.toISOString()).run();
      return new Response(null, { status: 204 });
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
