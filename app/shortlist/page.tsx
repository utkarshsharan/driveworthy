"use client";

import { useEffect, useState } from "react";

type SavedCar = {
  id: string; brand: string; model: string; variant: string; year: number; kilometres: number; fuel: string;
  price: number; score: number; source: string; sourceUrl: string; imageUrl: string;
};

function price(value: number) {
  return `₹${value.toFixed(value % 1 === 0 ? 0 : 2)}L`;
}

export default function ShortlistPage() {
  const [cars, setCars] = useState<SavedCar[]>([]);

  useEffect(() => {
    try { setCars(JSON.parse(window.localStorage.getItem("driveworthy-shortlist") ?? "[]")); } catch { setCars([]); }
  }, []);

  const remove = (id: string) => {
    setCars((current) => {
      const next = current.filter((car) => car.id !== id);
      window.localStorage.setItem("driveworthy-shortlist", JSON.stringify(next));
      return next;
    });
  };

  return (
    <main className="shortlist-page">
      <header className="site-header">
        <a className="brand-mark" href="/" aria-label="Driveworthy home"><span className="brand-symbol" aria-hidden="true"><i /><i /></span><span>DRIVEWORTHY</span></a>
        <a className="shortlist-back" href="/">← Back to market</a>
      </header>
      <section className="shortlist-hero">
        <p className="eyebrow">Your shortlist</p>
        <h1>{cars.length ? `${cars.length} car${cars.length === 1 ? "" : "s"} worth a closer look.` : "Your shortlist is empty."}</h1>
        <p>{cars.length ? "Compare the cars you saved, then open the original listing when you are ready." : "Use the + button on any listing to keep it here for comparison."}</p>
      </section>
      {cars.length > 0 && <section className="shortlist-grid">
        {cars.map((car) => <article className="shortlist-card" key={car.id}>
          <img src={car.imageUrl} alt={`${car.year} ${car.brand} ${car.model}`} />
          <div><p>{car.year} · {car.brand}</p><h2>{car.model} <span>{car.variant}</span></h2><ul><li>{car.kilometres.toLocaleString("en-IN")} km</li><li>{car.fuel}</li><li>Score {car.score}</li></ul><strong>{price(car.price)}</strong></div>
          <div className="shortlist-actions"><a href={car.sourceUrl} target="_blank" rel="noreferrer">View listing ↗</a><button type="button" onClick={() => remove(car.id)}>Remove</button></div>
        </article>)}
      </section>}
    </main>
  );
}
