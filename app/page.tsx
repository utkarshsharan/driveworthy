/* eslint-disable @next/next/no-img-element -- remote marketplace photos use source-owned URLs */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Brand = "BMW" | "Mercedes-Benz" | "Audi" | "Volvo" | "Lexus";

type Listing = {
  id: string;
  rank: number;
  brand: Brand;
  model: string;
  variant: string;
  year: number;
  kilometres: number;
  fuel: string;
  transmission: string;
  owners: number;
  price: number;
  fairLow: number;
  fairHigh: number;
  score: number;
  confidence: "High" | "Medium";
  source: string;
  sourceUrl: string;
  imageUrl: string;
  positive: string;
  concern: string;
  freshness: string;
};

const MODEL_OPTIONS: Record<Brand, string[]> = {
  BMW: ["2 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "M340i"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS"],
  Audi: ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
  Lexus: ["ES", "NX", "RX", "LS"],
};

const LISTINGS: Listing[] = [
  {
    id: "bmw-m340i-9g",
    rank: 1,
    brand: "BMW",
    model: "M340i",
    variant: "xDrive",
    year: 2023,
    kilometres: 30288,
    fuel: "Petrol",
    transmission: "Automatic",
    owners: 1,
    price: 61.75,
    fairLow: 64.1,
    fairHigh: 68.2,
    score: 92,
    confidence: "High",
    source: "9th Gear",
    sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-m-340i-xdrive/25632/",
    imageUrl: "https://www.9thgear.co.in/images/upload/cars/69b513f028986.webp",
    positive: "Priced below comparable Bengaluru inventory",
    concern: "Verify service history and tyre life",
    freshness: "Checked today",
  },
  {
    id: "audi-q3-luxe",
    rank: 2,
    brand: "Audi",
    model: "Q3",
    variant: "40 TFSI Q Tech",
    year: 2023,
    kilometres: 5956,
    fuel: "Petrol",
    transmission: "Automatic",
    owners: 1,
    price: 44,
    fairLow: 44.8,
    fairHigh: 47.3,
    score: 89,
    confidence: "High",
    source: "Luxe Cars",
    sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/audi-q3-2014",
    imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/65d080ffebf233a7670051daf013256b.jpeg",
    positive: "Very low kilometres for its age",
    concern: "Confirm warranty transfer eligibility",
    freshness: "Checked today",
  },
  {
    id: "lexus-es-luxe",
    rank: 3,
    brand: "Lexus",
    model: "ES",
    variant: "300h Luxury",
    year: 2021,
    kilometres: 7979,
    fuel: "Hybrid",
    transmission: "Automatic",
    owners: 1,
    price: 45.5,
    fairLow: 45.2,
    fairHigh: 48.9,
    score: 86,
    confidence: "Medium",
    source: "Luxe Cars",
    sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/LEXUS-ES%20300H-3606",
    imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/919d0fd8ea323f9636bdbe425a32453f.jpeg",
    positive: "Low-use hybrid with strong luxury value",
    concern: "Fewer local comparables reduce confidence",
    freshness: "Checked today",
  },
  {
    id: "bmw-x1-9g",
    rank: 4,
    brand: "BMW",
    model: "X1",
    variant: "sDrive20d",
    year: 2020,
    kilometres: 40911,
    fuel: "Diesel",
    transmission: "Automatic",
    owners: 1,
    price: 27.75,
    fairLow: 27.4,
    fairHigh: 30.1,
    score: 82,
    confidence: "High",
    source: "9th Gear",
    sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-x1-sdrive-20d/25655/",
    imageUrl: "https://www.9thgear.co.in/images/upload/cars/69e383e053204.webp",
    positive: "Competitive entry price for the segment",
    concern: "Inspect diesel usage and suspension wear",
    freshness: "Checked today",
  },
  {
    id: "mercedes-e200-luxe",
    rank: 5,
    brand: "Mercedes-Benz",
    model: "E-Class",
    variant: "E 200 Exclusive",
    year: 2021,
    kilometres: 43026,
    fuel: "Petrol",
    transmission: "Automatic",
    owners: 1,
    price: 48,
    fairLow: 47.2,
    fairHigh: 50.6,
    score: 78,
    confidence: "Medium",
    source: "Luxe Cars",
    sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars",
    imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/e756034e2c4803ec69f45778151b1098.jpeg",
    positive: "Desirable trim with sensible asking price",
    concern: "Mileage is above the shortlisted-set median",
    freshness: "Checked today",
  },
  {
    id: "mercedes-gla-9g",
    rank: 6,
    brand: "Mercedes-Benz",
    model: "GLA",
    variant: "220d 4MATIC",
    year: 2018,
    kilometres: 78263,
    fuel: "Diesel",
    transmission: "Automatic",
    owners: 2,
    price: 22.75,
    fairLow: 21.8,
    fairHigh: 24.1,
    score: 69,
    confidence: "Medium",
    source: "9th Gear",
    sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-gla-220d-4matic/25656/",
    imageUrl: "https://www.9thgear.co.in/images/upload/cars/69e76c0b50e24.webp",
    positive: "Accessible price for a premium AWD SUV",
    concern: "Higher kilometres and two-owner history",
    freshness: "Checked today",
  },
];

const BRANDS = Object.keys(MODEL_OPTIONS) as Brand[];

function money(value: number) {
  return `₹${value.toFixed(value % 1 === 0 ? 0 : 2)}L`;
}

function scoreLabel(score: number) {
  if (score >= 88) return "Exceptional buy";
  if (score >= 80) return "Strong buy";
  if (score >= 72) return "Fair buy";
  return "Consider carefully";
}

export default function Home() {
  const [brand, setBrand] = useState<Brand | "">("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [kilometres, setKilometres] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!alertOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAlertOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [alertOpen]);

  const filteredListings = useMemo(() => {
    return LISTINGS.filter((listing) => {
      if (brand && listing.brand !== brand) return false;
      if (model && listing.model !== model) return false;
      if (year && listing.year < Number(year)) return false;
      if (kilometres && listing.kilometres > Number(kilometres)) return false;
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [brand, model, year, kilometres]);

  const clearFilters = () => {
    setBrand("");
    setModel("");
    setYear("");
    setKilometres("");
  };

  const submitAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlertSaved(true);
  };

  const activeFilterText = [brand, model, year && `${year}+`, kilometres && `under ${Number(kilometres).toLocaleString("en-IN")} km`]
    .filter(Boolean)
    .join(" · ");

  return (
    <main>
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Driveworthy home">
          <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
          <span>DRIVEWORTHY</span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#discover">Discover</a>
          <a href="#scoring">How scoring works</a>
          <button className="nav-alert" type="button" onClick={() => { setAlertSaved(false); setAlertOpen(true); }}>
            Set an alert <span aria-hidden="true">↗</span>
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <img
          className="hero-image"
          src="https://www.9thgear.co.in/images/upload/cars/69b513f028986.webp"
          alt="BMW M340i listed for sale in Bengaluru"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow light">Bengaluru · Pre-owned luxury cars</p>
          <h1>Buy the car.<br />Not the sales pitch.</h1>
          <p className="hero-copy">One clear view of the market, ranked by value, condition signals and confidence—not by who paid to be first.</p>
          <a className="hero-cta" href="#discover">See the best deals <span aria-hidden="true">↓</span></a>
        </div>
        <p className="image-credit">Actual listing photo · 9th Gear</p>
      </section>

      <section className="discovery" id="discover">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your car</p>
            <h2>Start broad. Get specific when you want.</h2>
          </div>
          <p>Leave every field blank and we’ll rank the strongest deals across the market.</p>
        </div>

        <div className="filter-panel">
          <label>
            <span>Company</span>
            <select value={brand} onChange={(event) => { setBrand(event.target.value as Brand | ""); setModel(""); }}>
              <option value="">All companies</option>
              {BRANDS.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Model</span>
            <select value={model} disabled={!brand} onChange={(event) => setModel(event.target.value)}>
              <option value="">{brand ? "All models" : "Choose company first"}</option>
              {brand && MODEL_OPTIONS[brand].map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Year</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="">Any year</option>
              <option value="2024">2024 or newer</option>
              <option value="2022">2022 or newer</option>
              <option value="2020">2020 or newer</option>
              <option value="2018">2018 or newer</option>
            </select>
          </label>
          <label>
            <span>Kilometres</span>
            <select value={kilometres} onChange={(event) => setKilometres(event.target.value)}>
              <option value="">Any distance</option>
              <option value="10000">Under 10,000 km</option>
              <option value="30000">Under 30,000 km</option>
              <option value="50000">Under 50,000 km</option>
              <option value="80000">Under 80,000 km</option>
            </select>
          </label>
          <button className="filter-action" type="button" onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>
            Show ranked cars <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="source-strip" aria-label="Market sources">
          <span>Market coverage</span>
          <strong>9th Gear</strong>
          <strong>Luxe Cars</strong>
          <strong>Citizen Carz</strong>
          <strong>OEM certified</strong>
          <em>More connectors coming</em>
        </div>
      </section>

      <section className="results" id="results">
        <div className="results-header">
          <div>
            <p className="eyebrow">Ranked by deal score</p>
            <h2>{activeFilterText || "The strongest deals in Bengaluru"}</h2>
          </div>
          <div className="results-meta">
            <span>{filteredListings.length} cars found</span>
            {(brand || model || year || kilometres) && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>

        <div className="prototype-note">
          <span>V1 market preview</span>
          Prices and photos come from the source listings. Fair-value ranges and scores are illustrative until the model is trained on sufficient historical data.
        </div>

        <div className="listing-list">
          {filteredListings.map((listing, index) => (
            <article className="listing-card" key={listing.id}>
              <div className="rank" aria-label={`Rank ${index + 1}`}>{String(index + 1).padStart(2, "0")}</div>
              <a className="car-image-wrap" href={listing.sourceUrl} target="_blank" rel="noreferrer">
                <img className="car-image" src={listing.imageUrl} alt={`${listing.year} ${listing.brand} ${listing.model} from ${listing.source}`} loading="lazy" />
                <span className="source-badge">{listing.source}</span>
              </a>
              <div className="car-details">
                <div className="car-title-row">
                  <div>
                    <p>{listing.year} · {listing.brand}</p>
                    <h3>{listing.model} <span>{listing.variant}</span></h3>
                  </div>
                  <button
                    className={`save-button ${savedIds.includes(listing.id) ? "saved" : ""}`}
                    type="button"
                    aria-label={`${savedIds.includes(listing.id) ? "Remove" : "Save"} ${listing.brand} ${listing.model}`}
                    aria-pressed={savedIds.includes(listing.id)}
                    onClick={() => setSavedIds((current) => current.includes(listing.id) ? current.filter((id) => id !== listing.id) : [...current, listing.id])}
                  >
                    {savedIds.includes(listing.id) ? "✓" : "＋"}
                  </button>
                </div>
                <div className="spec-row">
                  <span>{listing.kilometres.toLocaleString("en-IN")} km</span>
                  <span>{listing.fuel}</span>
                  <span>{listing.transmission}</span>
                  <span>{listing.owners} owner{listing.owners > 1 ? "s" : ""}</span>
                </div>
                <div className="price-row">
                  <div><span>Asking price</span><strong>{money(listing.price)}</strong></div>
                  <div><span>Estimated fair range</span><strong>{money(listing.fairLow)}–{money(listing.fairHigh)}</strong></div>
                </div>
                <div className="signals">
                  <p className="positive"><span aria-hidden="true">+</span>{listing.positive}</p>
                  <p className="concern"><span aria-hidden="true">!</span>{listing.concern}</p>
                </div>
                <a className="listing-link" href={listing.sourceUrl} target="_blank" rel="noreferrer">
                  View original listing <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="score-panel">
                <p>Deal score</p>
                <div className="score-number"><strong>{listing.score}</strong><span>/100</span></div>
                <div className="score-track"><span style={{ width: `${listing.score}%` }} /></div>
                <h4>{scoreLabel(listing.score)}</h4>
                <p className="confidence">{listing.confidence} confidence · {listing.freshness}</p>
              </div>
            </article>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="empty-state">
            <p className="eyebrow">No current match</p>
            <h3>The right car may not be listed yet.</h3>
            <p>Keep these filters and we’ll watch every connected source for you.</p>
            <button type="button" onClick={() => { setAlertSaved(false); setAlertOpen(true); }}>Create this alert <span aria-hidden="true">→</span></button>
          </div>
        )}
      </section>

      <section className="scoring" id="scoring">
        <div className="scoring-intro">
          <p className="eyebrow light">How the score earns your trust</p>
          <h2>A useful number should explain itself.</h2>
          <p>Each car is compared against similar Bengaluru listings. The score balances price advantage with mileage, age, ownership, seller information, listing freshness and the certainty of our estimate.</p>
        </div>
        <div className="score-factors">
          <div><span>01</span><h3>Fair value</h3><p>Predicted from comparable cars—not the seller’s claim.</p></div>
          <div><span>02</span><h3>Vehicle signals</h3><p>Age, kilometres, ownership and disclosed history shape the risk.</p></div>
          <div><span>03</span><h3>Confidence</h3><p>Thin data lowers certainty visibly instead of pretending precision.</p></div>
        </div>
      </section>

      <section className="alert-cta">
        <div>
          <p className="eyebrow light">Don’t keep refreshing six websites</p>
          <h2>Tell us the car. We’ll watch the market.</h2>
        </div>
        <button type="button" onClick={() => { setAlertSaved(false); setAlertOpen(true); }}>Set a personalised alert <span aria-hidden="true">↗</span></button>
      </section>

      <footer>
        <a className="brand-mark footer-brand" href="#top"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>DRIVEWORTHY</span></a>
        <p>Independent intelligence for pre-owned luxury cars in Bengaluru.</p>
        <p>Listing rights remain with their original sources.</p>
      </footer>

      {alertOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setAlertOpen(false); }}>
          <section className="alert-modal" role="dialog" aria-modal="true" aria-labelledby="alert-title">
            <button className="modal-close" type="button" onClick={() => setAlertOpen(false)} aria-label="Close alert form">×</button>
            {!alertSaved ? (
              <>
                <p className="eyebrow">Your personal watchlist</p>
                <h2 id="alert-title">Set a market alert</h2>
                <p className="modal-copy">We’ll email you when a newly listed car matches your criteria or a tracked car drops in price.</p>
                <form onSubmit={submitAlert}>
                  <div className="form-grid">
                    <label><span>Email address</span><input type="email" required placeholder="you@example.com" /></label>
                    <label><span>Company</span><select defaultValue={brand}><option value="">Any company</option>{BRANDS.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span>Model</span><input defaultValue={model} placeholder="Any model" /></label>
                    <label><span>Minimum year</span><input type="number" min="2010" max="2026" defaultValue={year} placeholder="2020" /></label>
                    <label><span>Maximum kilometres</span><input type="number" min="0" step="1000" defaultValue={kilometres} placeholder="50,000" /></label>
                    <label><span>Maximum price (₹ lakh)</span><input type="number" min="1" step="0.5" placeholder="50" /></label>
                    <label><span>Minimum deal score</span><select defaultValue="80"><option value="">Any score</option><option value="90">90+ Exceptional</option><option value="80">80+ Strong</option><option value="70">70+ Fair</option></select></label>
                    <label><span>Alert frequency</span><select defaultValue="instant"><option value="instant">As soon as it appears</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></label>
                  </div>
                  <button className="submit-alert" type="submit">Create my alert <span aria-hidden="true">→</span></button>
                  <small>No spam. You can stop an alert from any email.</small>
                </form>
              </>
            ) : (
              <div className="alert-success">
                <span aria-hidden="true">✓</span>
                <p className="eyebrow">Alert ready</p>
                <h2 id="alert-title">Your search is saved.</h2>
                <p>This prototype has captured the alert flow. Email delivery will activate when the live inventory and account backend are connected.</p>
                <button type="button" onClick={() => setAlertOpen(false)}>Continue exploring</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
