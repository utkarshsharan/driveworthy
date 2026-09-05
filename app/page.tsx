/* eslint-disable @next/next/no-img-element -- remote marketplace photos use source-owned URLs */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Brand = "BMW" | "Mercedes-Benz" | "Audi" | "Volvo" | "Lexus";

type Listing = {
  id: string;
  brand: Brand;
  model: string;
  variant: string;
  year: number;
  kilometres: number;
  fuel: string;
  transmission: string;
  owners: number | null;
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
  BMW: ["2 Series", "3 Series", "5 Series", "6 Series", "7 Series", "X1", "X3", "X5", "X7", "M340i"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "EQB", "EQC", "EQS", "V-Class"],
  Audi: ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
  Lexus: ["ES", "NX", "RX", "LS"],
};

const LISTINGS: Listing[] = [
  { id: "bmw-m340i-9g", brand: "BMW", model: "M340i", variant: "xDrive", year: 2023, kilometres: 30288, fuel: "Petrol", transmission: "Automatic", owners: null, price: 61.75, fairLow: 64.1, fairHigh: 68.2, score: 92, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-m-340i-xdrive/25632/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/69b513f028986.webp", positive: "Priced below similar M340i listings", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "mercedes-a200-9g", brand: "Mercedes-Benz", model: "A-Class", variant: "A 200", year: 2024, kilometres: 10650, fuel: "Petrol", transmission: "Automatic", owners: null, price: 39.75, fairLow: 40.4, fairHigh: 43.2, score: 91, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-a200/25742/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a82ec7f16da1.webp", positive: "Young car with low kilometres", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "bmw-530li-luxe", brand: "BMW", model: "5 Series", variant: "530Li M Sport", year: 2025, kilometres: 9050, fuel: "Petrol", transmission: "Automatic", owners: 1, price: 73, fairLow: 74.2, fairHigh: 78.5, score: 90, confidence: "High", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/bmw-530li-5431", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/59c3cecc467a10336f27960931e42b9a.jpg", positive: "Current-generation, low-use one-owner car", concern: "Confirm manufacturer warranty transfer", freshness: "Checked 5 Sep" },
  { id: "volvo-xc40-luxe", brand: "Volvo", model: "XC40", variant: "B4", year: 2023, kilometres: 22311, fuel: "Petrol", transmission: "Automatic", owners: 2, price: 35.4, fairLow: 36.1, fairHigh: 39.2, score: 89, confidence: "High", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/volvo-xc40-4431", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/bcf617c944d0fbf319b714a86e4a7e08.jpg", positive: "Strong asking price for age and kilometres", concern: "Two-owner history needs verification", freshness: "Checked 5 Sep" },
  { id: "mercedes-glc-low-km-9g", brand: "Mercedes-Benz", model: "GLC", variant: "220d 4MATIC", year: 2022, kilometres: 31800, fuel: "Diesel", transmission: "Automatic", owners: null, price: 47.75, fairLow: 48.1, fairHigh: 52.4, score: 88, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-glc-220d-4matic/25747/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a8997710f39a.webp", positive: "Good kilometres for a diesel GLC", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "lexus-es-luxe", brand: "Lexus", model: "ES", variant: "300h Luxury", year: 2022, kilometres: 15364, fuel: "Hybrid", transmission: "Automatic", owners: 1, price: 47, fairLow: 47.5, fairHigh: 51.3, score: 87, confidence: "Medium", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/lexus-es300h-3339", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/2da1cea88b3c2ac07619fa852ea0d425.jpg", positive: "Low-use, one-owner hybrid", concern: "Fewer Bengaluru comparables lower confidence", freshness: "Checked 5 Sep" },
  { id: "bmw-620d-9g", brand: "BMW", model: "6 Series", variant: "620d GT Luxury Line", year: 2019, kilometres: 19402, fuel: "Diesel", transmission: "Automatic", owners: null, price: 41.75, fairLow: 42.2, fairHigh: 45.8, score: 86, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-620d-gt-luxury-line/25750/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a8e97d29a41e.webp", positive: "Exceptionally low kilometres for its year", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "mercedes-eqc-9g", brand: "Mercedes-Benz", model: "EQC", variant: "400 4MATIC", year: 2021, kilometres: 32003, fuel: "Electric", transmission: "Automatic", owners: null, price: 46.75, fairLow: 47.4, fairHigh: 52.1, score: 85, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-eqc-400-4matic/25732/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a6b4e9cc0f34.webp", positive: "Large depreciation advantage versus new", concern: "Battery health report is essential", freshness: "Checked 5 Sep" },
  { id: "audi-a4-9g", brand: "Audi", model: "A4", variant: "35 TDI Premium", year: 2016, kilometres: 29576, fuel: "Diesel", transmission: "Automatic", owners: null, price: 19.25, fairLow: 19.6, fairHigh: 21.8, score: 83, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/audi-a4-35-tdi-premium-sunroof/22025/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/22025-2025-11-22-05-28-14-IMG_1751.webp", positive: "Low kilometres relative to age", concern: "Age increases maintenance exposure", freshness: "Checked 5 Sep" },
  { id: "bmw-x1-9g", brand: "BMW", model: "X1", variant: "sDrive20d", year: 2020, kilometres: 40911, fuel: "Diesel", transmission: "Automatic", owners: null, price: 27.75, fairLow: 27.9, fairHigh: 30.1, score: 82, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-x1-sdrive-20d/25655/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/69e383e053204.webp", positive: "Competitive entry price for the segment", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "lexus-nx350h-luxe", brand: "Lexus", model: "NX", variant: "350h Luxury", year: 2023, kilometres: 25858, fuel: "Hybrid", transmission: "Automatic", owners: 1, price: 60, fairLow: 59.2, fairHigh: 63.8, score: 81, confidence: "Medium", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/lexus-nx350h-1548", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/a3b52dd4a2335452fadb252368fd2fd6.jpeg", positive: "One-owner current-generation hybrid", concern: "Insurance renewal is reportedly due", freshness: "Checked 5 Sep" },
  { id: "volvo-xc60-9g", brand: "Volvo", model: "XC60", variant: "B5 Ultimate", year: 2023, kilometres: 25620, fuel: "Petrol", transmission: "Automatic", owners: null, price: 57.75, fairLow: 56.8, fairHigh: 61.3, score: 80, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/volvo-xc60-b5-ultimate/25751/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a91658a37f34.webp", positive: "Modern safety specification and sensible use", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "mercedes-e200-9g", brand: "Mercedes-Benz", model: "E-Class", variant: "E 200", year: 2021, kilometres: 28082, fuel: "Petrol", transmission: "Automatic", owners: null, price: 52.75, fairLow: 51.8, fairHigh: 55.6, score: 79, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-e-200-petrol/25739/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a7b0b98b1113.webp", positive: "Low kilometres for a 2021 executive sedan", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "bmw-630i-luxe", brand: "BMW", model: "6 Series", variant: "630i GT M Sport", year: 2023, kilometres: 24974, fuel: "Petrol", transmission: "Automatic", owners: 1, price: 59.5, fairLow: 58.6, fairHigh: 63.2, score: 78, confidence: "Medium", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/bmw-630i-gt-8227", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/2b7f5997bae154fd0239cb33b798b68b.jpeg", positive: "One-owner M Sport with moderate use", concern: "Insurance renewal is reportedly due", freshness: "Checked 5 Sep" },
  { id: "audi-q8-luxe", brand: "Audi", model: "Q8", variant: "55 TFSI Celebration", year: 2023, kilometres: 21213, fuel: "Petrol", transmission: "Automatic", owners: 1, price: 78, fairLow: 76.4, fairHigh: 82.5, score: 77, confidence: "Medium", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/audi-q8celebration-2740", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/73a726cc696b9e2cd24762df6d010959.jpg", positive: "Low-use one-owner flagship SUV", concern: "High-ticket segment has fewer comparables", freshness: "Checked 5 Sep" },
  { id: "mercedes-eqb-9g", brand: "Mercedes-Benz", model: "EQB", variant: "300 4MATIC", year: 2023, kilometres: 25127, fuel: "Electric", transmission: "Automatic", owners: null, price: 53.75, fairLow: 51.9, fairHigh: 56.4, score: 76, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-eqb-300-4matic/25736/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a75c569478cc.webp", positive: "Recent premium EV with practical mileage", concern: "Battery health report is essential", freshness: "Checked 5 Sep" },
  { id: "mercedes-glc-petrol-9g", brand: "Mercedes-Benz", model: "GLC", variant: "200 4MATIC", year: 2020, kilometres: 43934, fuel: "Petrol", transmission: "Automatic", owners: null, price: 37.75, fairLow: 36.9, fairHigh: 40.1, score: 75, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-glc-200-4matic/25730/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a6876e517b63.webp", positive: "Asking price sits within expected range", concern: "Ownership count is not disclosed", freshness: "Checked 5 Sep" },
  { id: "bmw-630d-9g", brand: "BMW", model: "6 Series", variant: "630d GT Luxury Line", year: 2018, kilometres: 59975, fuel: "Diesel", transmission: "Automatic", owners: null, price: 36.75, fairLow: 35.8, fairHigh: 39.4, score: 73, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-630d-gt-luxury-line/25693/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a27bee8db4a9.webp", positive: "Powertrain and body style retain buyer appeal", concern: "Higher age increases upkeep risk", freshness: "Checked 5 Sep" },
  { id: "lexus-nx300h-luxe", brand: "Lexus", model: "NX", variant: "300h Luxury", year: 2019, kilometres: 86282, fuel: "Hybrid", transmission: "Automatic", owners: 1, price: 33, fairLow: 31.8, fairHigh: 35.1, score: 70, confidence: "Medium", source: "Luxe Cars", sourceUrl: "https://luxecars.co.in/catalog/used-luxury-cars/lexus-nx300h-4041", imageUrl: "https://luxecars.blr1.cdn.digitaloceanspaces.com/36866c34018678ef09fbb7a34a6a52e5.jpg", positive: "One-owner luxury hybrid at an accessible price", concern: "High kilometres require battery and suspension checks", freshness: "Checked 5 Sep" },
  { id: "audi-q3-9g", brand: "Audi", model: "Q3", variant: "35 TDI Premium", year: 2016, kilometres: 69297, fuel: "Diesel", transmission: "Automatic", owners: null, price: 18.75, fairLow: 17.9, fairHigh: 20.2, score: 69, confidence: "High", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/audi-q3-35-tdi-premium/25722/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a5b40e038ccc.webp", positive: "Price is aligned with comparable older Q3s", concern: "Age and kilometres raise maintenance risk", freshness: "Checked 5 Sep" },
  { id: "bmw-x3-9g", brand: "BMW", model: "X3", variant: "xDrive20d", year: 2015, kilometres: 87183, fuel: "Diesel", transmission: "Automatic", owners: null, price: 19.75, fairLow: 18.4, fairHigh: 20.6, score: 65, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/bmw-x3-xdrive-20d/25727/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/6a5e01019c737.webp", positive: "Attractive entry price for an X3", concern: "High-use older diesel needs deep inspection", freshness: "Checked 5 Sep" },
  { id: "mercedes-gla-9g", brand: "Mercedes-Benz", model: "GLA", variant: "220d 4MATIC", year: 2018, kilometres: 78263, fuel: "Diesel", transmission: "Automatic", owners: null, price: 22.75, fairLow: 21.8, fairHigh: 24.1, score: 64, confidence: "Medium", source: "9th Gear", sourceUrl: "https://www.9thgear.co.in/luxury-used-cars/mercedes-benz-gla-220d-4matic/25656/", imageUrl: "https://www.9thgear.co.in/images/upload/cars/69e76c0b50e24.webp", positive: "Accessible price for a premium AWD SUV", concern: "High kilometres and missing ownership data", freshness: "Checked 5 Sep" },
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
        <div className="hero-content">
          <p className="eyebrow light">Bengaluru · Pre-owned luxury cars</p>
          <h1>Buy the car.<br />Not the sales pitch.</h1>
          <p className="hero-copy">One clear view of the market, ranked by value, condition signals and confidence—not by who paid to be first.</p>
          <a className="hero-cta" href="#discover">See the best deals <span aria-hidden="true">↓</span></a>
        </div>
        <p className="hero-status"><span /> Independent market view · no promoted rankings</p>
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
          <span>Connected now</span>
          <strong>9th Gear <b>15</b></strong>
          <strong>Luxe Cars <b>7</b></strong>
          <em>22 verified sample listings</em>
          <small>Citizen Carz, Auto Port and OEM-certified connectors next</small>
        </div>
      </section>

      <section className="results" id="results">
        <div className="results-header">
          <div>
            <p className="eyebrow">Ranked by deal score</p>
            <h2>{activeFilterText || "The strongest deals in Bengaluru"}</h2>
          </div>
          <div className="results-meta">
            <span>{filteredListings.length} cars · {new Set(filteredListings.map((listing) => listing.source)).size} sources</span>
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
                  <span>{listing.owners === null ? "Owner data not listed" : `${listing.owners} owner${listing.owners > 1 ? "s" : ""}`}</span>
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
