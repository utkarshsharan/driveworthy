/* eslint-disable @next/next/no-img-element -- remote marketplace photos use source-owned URLs */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Brand = string;

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
  alsoListedOn?: { source: string; sourceUrl: string }[];
};

const MODEL_OPTIONS: Record<string, string[]> = {
  BMW: ["2 Series", "3 Series", "5 Series", "6 Series", "7 Series", "X1", "X3", "X5", "X7", "Z4", "M340i"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "EQB", "EQC", "EQS", "V-Class"],
  Audi: ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
  Lexus: ["ES", "NX", "RX", "LS"],
  Porsche: ["Cayenne", "Panamera"],
  "Land Rover": ["Defender", "Range Rover Velar"],
};

const CORE_LISTINGS: Listing[] = [
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

type SourceListing = Omit<Listing, "fairLow" | "fairHigh" | "transmission" | "confidence" | "positive" | "concern" | "freshness"> & Partial<Pick<Listing, "fairLow" | "fairHigh" | "transmission" | "confidence" | "positive" | "concern" | "freshness">>;

function sourceListing(listing: SourceListing): Listing {
  const score = listing.score;
  return {
    ...listing,
    transmission: listing.transmission ?? "Automatic",
    fairLow: listing.fairLow ?? Number((listing.price * 0.97).toFixed(2)),
    fairHigh: listing.fairHigh ?? Number((listing.price * 1.08).toFixed(2)),
    confidence: listing.confidence ?? "Medium",
    positive: listing.positive ?? (score >= 80 ? "Competitive age and kilometre profile" : "Useful market comparison for this model"),
    concern: listing.concern ?? (listing.owners === null ? "Ownership count is not disclosed" : "Confirm service and ownership records"),
    freshness: listing.freshness ?? "Checked 6 Sep",
  };
}

// Source-owned photos and outbound listing links were checked on 6 Sep 2026.
const EXPANDED_LISTINGS: Listing[] = [
  sourceListing({ id: "citizen-s450-2021", brand: "Mercedes-Benz", model: "S-Class", variant: "S 450 4MATIC", year: 2021, kilometres: 18000, fuel: "Petrol", owners: 1, price: 108, score: 84, source: "Citizen Carz", sourceUrl: "https://www.citizencarz.com/cars/mercedes-benz-s-class-2021-bangalore--8ce3d4b4-b3e1-4272-8e59-037217214690", imageUrl: "https://xmiwsfiykdwonwipouyp.supabase.co/storage/v1/object/public/car-images/cars/1785247168264-ebb1ji.jpeg", positive: "Low-use flagship with declared first ownership" }),
  sourceListing({ id: "citizen-defender-2022", brand: "Land Rover", model: "Defender", variant: "110 HSE 5str", year: 2022, kilometres: 66000, fuel: "Petrol", owners: 1, price: 96.75, score: 78, source: "Citizen Carz", sourceUrl: "https://www.citizencarz.com/cars/land-rover-defender-110-2022-bangalore--3d078fbc-f4af-45fb-9217-eef1a4aa85ae", imageUrl: "https://xmiwsfiykdwonwipouyp.supabase.co/storage/v1/object/public/car-images/ka14ma7261_1.jpg" }),
  sourceListing({ id: "citizen-gle-2024", brand: "Mercedes-Benz", model: "GLE", variant: "450 LWB", year: 2024, kilometres: 45000, fuel: "Petrol", owners: 1, price: 89.75, score: 82, source: "Citizen Carz", sourceUrl: "https://www.citizencarz.com/cars/mercedes-benz-gle-2024-bangalore--3e4c1a4e-871d-44ff-9ab0-2ab5dac1de65", imageUrl: "https://xmiwsfiykdwonwipouyp.supabase.co/storage/v1/object/public/car-images/cars/KA29P7200/1788416824585-16e7unj.jpg" }),
  sourceListing({ id: "citizen-q7-2022", brand: "Audi", model: "Q7", variant: "55 TFSI Premium Plus", year: 2022, kilometres: 44000, fuel: "Petrol", owners: 2, price: 57, score: 83, source: "Citizen Carz", sourceUrl: "https://www.citizencarz.com/cars/audi-q7-3-0-55-tfsi-quattro-2022-bangalore--6c1ff19b-f1ea-4412-b998-a5a5dd5f8cd7", imageUrl: "https://xmiwsfiykdwonwipouyp.supabase.co/storage/v1/object/public/car-images/cars/KA01MX6364/1788513763241-1wpqmq4.jpg" }),
  sourceListing({ id: "citizen-530d-2019", brand: "BMW", model: "5 Series", variant: "530d M Sport", year: 2019, kilometres: 48000, fuel: "Diesel", owners: 2, price: 42, score: 80, source: "Citizen Carz", sourceUrl: "https://www.citizencarz.com/cars/bmw-5-series-2019-bangalore--a199b200-8e4c-4c48-8082-3c826bc7f1d3", imageUrl: "https://xmiwsfiykdwonwipouyp.supabase.co/storage/v1/object/public/car-images/cars/1785159986214-0myqul.jpeg" }),
  sourceListing({ id: "arihant-velar-2024", brand: "Land Rover", model: "Range Rover Velar", variant: "R-Dynamic", year: 2024, kilometres: 26765, fuel: "Diesel", owners: null, price: 75, score: 85, source: "Arihant Cars", sourceUrl: "https://www.arihantcars.com/vdp/4785284", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202609/4785284_2427_1788514288743.jpg" }),
  sourceListing({ id: "arihant-520d-2020", brand: "BMW", model: "5 Series", variant: "520d", year: 2020, kilometres: 32162, fuel: "Diesel", owners: null, price: 30, score: 86, source: "Arihant Cars", sourceUrl: "https://www.arihantcars.com/vdp/4764957", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202609/4764957_2427_1788265615271.jpg" }),
  sourceListing({ id: "arihant-730ld-2022", brand: "BMW", model: "7 Series", variant: "730Ld", year: 2022, kilometres: 31000, fuel: "Diesel", owners: null, price: 80, score: 80, source: "Arihant Cars", sourceUrl: "https://www.arihantcars.com/vdp/4723324", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202608/4723324_2427_1787819123050.jpg" }),
  sourceListing({ id: "arihant-xc60-2019", brand: "Volvo", model: "XC60", variant: "D5 Inscription", year: 2019, kilometres: 61875, fuel: "Diesel", owners: null, price: 29, score: 77, source: "Arihant Cars", sourceUrl: "https://www.arihantcars.com/vdp/4772859", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202608/4772859_2427_1788088048461.jpg" }),
  sourceListing({ id: "arihant-cayenne-2015", brand: "Porsche", model: "Cayenne", variant: "Diesel", year: 2015, kilometres: 88750, fuel: "Diesel", owners: null, price: 35, score: 70, source: "Arihant Cars", sourceUrl: "https://www.arihantcars.com/vdp/4720057", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202608/4720057_2427_1785921547207.jpeg" }),
  sourceListing({ id: "motorz-glc43-2022", brand: "Mercedes-Benz", model: "GLC", variant: "43 AMG Coupe", year: 2022, kilometres: 63000, fuel: "Petrol", owners: 2, price: 64.75, score: 76, source: "Luxury Motorz", sourceUrl: "https://www.luxurymotorz.com/car-description/234/mercedes-benz-glc-43-amg-coupe", imageUrl: "https://www.luxurymotorz.com/static/car_varient/17759776921.jpeg" }),
  sourceListing({ id: "motorz-nx300h-2019", brand: "Lexus", model: "NX", variant: "300h Hybrid", year: 2019, kilometres: 89500, fuel: "Hybrid", owners: 1, price: 33.9, score: 75, source: "Luxury Motorz", sourceUrl: "https://www.luxurymotorz.com/car-description/229/lexus-nx-300h-hybrid", imageUrl: "https://www.luxurymotorz.com/static/car_varient/17684670061.jpeg" }),
  sourceListing({ id: "motorz-x3-2016", brand: "BMW", model: "X3", variant: "xDrive20d", year: 2016, kilometres: 92000, fuel: "Diesel", owners: 2, price: 21.45, score: 68, source: "Luxury Motorz", sourceUrl: "https://www.luxurymotorz.com/car-description/141/bmw-x3-x-drive-20d", imageUrl: "https://www.luxurymotorz.com/static/car_varient/1736232550WhatsApp%20Image%202024-04-19%20at%206.14.57%20PM.jpeg" }),
  sourceListing({ id: "carrazo-x3-2023", brand: "BMW", model: "X3", variant: "xDrive20d M Sport", year: 2023, kilometres: 46500, fuel: "Diesel", owners: null, price: 55, score: 82, source: "Carrazo", sourceUrl: "https://www.carrazocars.in/vdp/4780487", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202609/4780487_135351_1788349710667.jpeg" }),
  sourceListing({ id: "carrazo-gle-2022", brand: "Mercedes-Benz", model: "GLE", variant: "300d", year: 2022, kilometres: 50000, fuel: "Diesel", owners: null, price: 72, score: 79, source: "Carrazo", sourceUrl: "https://www.carrazocars.in/vdp/4771420", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202608/4771420_135351_1788009100791.jpg" }),
  sourceListing({ id: "carrazo-z4-2021", brand: "BMW", model: "Z4", variant: "M Sport", year: 2021, kilometres: 16500, fuel: "Petrol", owners: null, price: 70, score: 78, source: "Carrazo", sourceUrl: "https://www.carrazocars.in/vdp/4771359", imageUrl: "https://d9qgigtestb1c.cloudfront.net/thumbs/p-vmaxnwm-ver1/vimages/202608/4771359_135351_1788007883757.jpeg" }),
  sourceListing({ id: "carwale-520d-2023", brand: "BMW", model: "5 Series", variant: "520d M Sport", year: 2023, kilometres: 31526, fuel: "Diesel", owners: 1, price: 58, score: 81, source: "CarWale", sourceUrl: "https://www.carwale.com/used/bangalore/bmw-5-series/knt89xgd/", imageUrl: "https://imgd.aeplcdn.com/640X480/vimages/202608/4760570_146184_1787573982781.jpeg?qp=80&fit=true" }),
];

// Strict city policy: dealer inventory must be physically in Bengaluru; marketplaces must be filtered to Bengaluru.
const BENGALURU_SOURCES = new Set(["9th Gear", "Luxe Cars", "Citizen Carz", "Luxury Motorz", "CarWale"]);
const LISTINGS = [...CORE_LISTINGS, ...EXPANDED_LISTINGS].filter((listing) => BENGALURU_SOURCES.has(listing.source));
const ELIGIBLE_CITIZEN_BRANDS = new Set(["Audi", "BMW", "Jaguar", "Jeep", "Land Rover", "Maserati", "Mercedes Benz", "Mercedes-amg", "Mini", "Porsche", "Volvo"]);
const CITIZEN_API_URL = "https://xmiwsfiykdwonwipouyp.supabase.co/rest/v1/cars?select=*&status=eq.Available&order=created_at.desc";
const CITIZEN_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXdzZml5a2R3b253aXBvdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjcxOTEsImV4cCI6MjA1Njg0MzE5MX0.CZ2q4nQYJcjemr-KSFO76gweDXxyTGEaoXt7i0w4fwY";

type CitizenCar = {
  id: string; make: string; model: string; variant: string; transmission: string; fuel_type: string;
  kms_driven: number; year_mfg: string; ownership: string | null; price: number; images: string[];
};

type StoredListing = {
  id: string; brand: string; model: string; variant: string; year: number; kilometres: number;
  fuel: string; transmission: string; price_lakh: number; image_url: string; last_seen_at: string;
  source: string; source_url: string;
};

function storedListing(car: StoredListing): Listing {
  const score = Math.max(55, Math.min(86, Math.round(86 - Math.max(0, 2026 - car.year) * 2 - car.kilometres / 17000)));
  return sourceListing({ id: `stored-${car.id}`, brand: car.brand, model: car.model, variant: car.variant, year: car.year, kilometres: car.kilometres, fuel: car.fuel, transmission: car.transmission, owners: null, price: car.price_lakh, score, source: car.source, sourceUrl: car.source_url, imageUrl: car.image_url, positive: "Live Bengaluru marketplace listing", concern: "Confirm condition and ownership with the seller", freshness: "Live inventory" });
}

function vehicleKey(listing: Listing) {
  return `${listing.brand.toLowerCase()}|${listing.model.toLowerCase()}|${listing.year}|${listing.kilometres}`;
}

function mergeDuplicateListings(listings: Listing[]) {
  const grouped = new Map<string, Listing>();
  for (const listing of listings) {
    const key = vehicleKey(listing);
    const existing = grouped.get(key);
    if (!existing) { grouped.set(key, listing); continue; }
    const primary = existing.source === "CarWale" && listing.source !== "CarWale" ? listing : existing;
    const secondary = primary === existing ? listing : existing;
    const links = [...(primary.alsoListedOn ?? []), { source: secondary.source, sourceUrl: secondary.sourceUrl }]
      .filter((item, index, items) => item.sourceUrl !== primary.sourceUrl && items.findIndex((candidate) => candidate.sourceUrl === item.sourceUrl) === index);
    grouped.set(key, { ...primary, alsoListedOn: links });
  }
  return [...grouped.values()];
}

function citizenListing(car: CitizenCar): Listing {
  const brand = car.make === "Mercedes Benz" || car.make === "Mercedes-amg" ? "Mercedes-Benz" : car.make;
  const year = Number.parseInt(car.year_mfg, 10);
  const score = Math.max(58, Math.min(88, Math.round(86 - Math.max(0, 2026 - year) * 2 - car.kms_driven / 16000)));
  return sourceListing({
    id: `citizen-live-${car.id}`, brand, model: car.model, variant: car.variant, year,
    kilometres: car.kms_driven, fuel: car.fuel_type, transmission: car.transmission,
    owners: car.ownership ? Number.parseInt(car.ownership, 10) || null : null, price: car.price / 100000,
    score, source: "Citizen Carz", imageUrl: car.images[0],
    sourceUrl: `https://www.citizencarz.com/cars/${`${car.make} ${car.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${year}-bangalore--${car.id}`,
    positive: "Live available inventory from Citizen Carz", concern: "Confirm service history before purchase", freshness: "Live inventory",
  });
}

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

const BODY_TYPES = ["SUV", "Sedan", "Coupe", "Hatchback", "Convertible"] as const;
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;

function bodyTypeFor(listing: Listing) {
  const text = `${listing.model} ${listing.variant}`.toLowerCase();
  if (/coupe|gran coupe|z4|cabriolet|convertible|spyder/.test(text)) return /cabriolet|convertible|spyder|z4/.test(text) ? "Convertible" : "Coupe";
  if (/^x\d|^q\d|^xc\d|^gl|^gle|^gla|^glc|^gls|range rover|defender|discovery|cayenne|macan|nx|rx/.test(listing.model.toLowerCase())) return "SUV";
  if (/mini|a-class|1 series|2 series active/.test(text)) return "Hatchback";
  return "Sedan";
}

function monthlyEmi(principalLakh: number, annualRate: number, years: number) {
  const months = Math.max(1, years * 12);
  const monthlyRate = annualRate / 12 / 100;
  if (!monthlyRate) return (principalLakh * 100000) / months;
  return (principalLakh * 100000 * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
}

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export default function Home() {
  const [brand, setBrand] = useState<Brand | "">("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [kilometres, setKilometres] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [source, setSource] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [downPayment, setDownPayment] = useState("15");
  const [loanAmount, setLoanAmount] = useState("40");
  const [interestRate, setInterestRate] = useState("10.5");
  const [loanYears, setLoanYears] = useState("5");
  const [maxMonthlyEmi, setMaxMonthlyEmi] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [liveCitizenListings, setLiveCitizenListings] = useState<Listing[]>([]);
  const [liveCarWaleListings, setLiveCarWaleListings] = useState<Listing[]>([]);

  useEffect(() => {
    let active = true;
    fetch(CITIZEN_API_URL, { headers: { apikey: CITIZEN_ANON_KEY } })
      .then((response) => response.ok ? response.json() : [])
      .then((cars: CitizenCar[]) => {
        if (!active) return;
        const imported = cars
          .filter((car) => ELIGIBLE_CITIZEN_BRANDS.has(car.make) && car.images?.[0])
          .map(citizenListing);
        setLiveCitizenListings(imported);
      })
      .catch(() => { /* The static, last-checked Citizen listings remain visible if the source is unavailable. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("refresh") !== "carwale") return;
    fetch("/market-refresh?run=1").catch(() => { /* A later visit will retry the marketplace refresh. */ });
  }, []);

  useEffect(() => {
    fetch("/api/listings")
      .then((response) => response.ok ? response.json() : [])
      .then((records: StoredListing[]) => setLiveCarWaleListings(records.map(storedListing)))
      .catch(() => { /* Static dealer listings remain available while the marketplace feed refreshes. */ });
  }, []);

  const allListings = useMemo(() => {
    const liveCitizenUrls = new Set(liveCitizenListings.map((listing) => listing.sourceUrl));
    return mergeDuplicateListings([...LISTINGS.filter((listing) => listing.source !== "Citizen Carz" || !liveCitizenUrls.has(listing.sourceUrl)), ...liveCitizenListings, ...liveCarWaleListings]);
  }, [liveCitizenListings, liveCarWaleListings]);

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
    return allListings.filter((listing) => {
      if (brand && listing.brand !== brand) return false;
      if (model && listing.model !== model) return false;
      if (year && listing.year < Number(year)) return false;
      if (kilometres && listing.kilometres > Number(kilometres)) return false;
      if (bodyType && bodyTypeFor(listing) !== bodyType) return false;
      if (fuelType && listing.fuel !== fuelType) return false;
      if (source && listing.source !== source) return false;
      if (maxMonthlyEmi && monthlyEmi(Math.max(0, listing.price - Number(downPayment || 0)), Number(interestRate || 0), Number(loanYears || 1)) > Number(maxMonthlyEmi)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "year-new") return b.year - a.year;
      if (sortBy === "kms-low") return a.kilometres - b.kilometres;
      if (sortBy === "kms-high") return b.kilometres - a.kilometres;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return b.score - a.score;
    });
  }, [allListings, brand, model, year, kilometres, bodyType, fuelType, source, sortBy, downPayment, interestRate, loanYears, maxMonthlyEmi]);

  useEffect(() => setVisibleCount(12), [brand, model, year, kilometres, bodyType, fuelType, source, sortBy, maxMonthlyEmi]);

  const clearFilters = () => {
    setBrand("");
    setModel("");
    setYear("");
    setKilometres("");
    setBodyType("");
    setFuelType("");
    setSource("");
    setMaxMonthlyEmi("");
  };

  const submitAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlertSaved(true);
  };

  const activeFilterText = [source, brand, model, bodyType, fuelType, year && `${year}+`, kilometres && `under ${Number(kilometres).toLocaleString("en-IN")} km`, maxMonthlyEmi && `under ₹${rupees(Number(maxMonthlyEmi))}/mo`]
    .filter(Boolean)
    .join(" · ");

  return (
    <main>
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="Driveworthy home">
          <span className="brand-symbol" aria-hidden="true"><i /><i /></span>
          <span>DRIVEWORTHY</span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#discover">Discover</a>
          <a href="#scoring">How scoring works</a>
          <button className="nav-alert" type="button" onClick={() => { setAlertSaved(false); setAlertOpen(true); }}>
            <span className="bell" aria-hidden="true">◌</span> Set an alert
          </button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-content">
          <p className="eyebrow light">Bengaluru · Pre-owned luxury cars</p>
          <h1>Bengaluru’s luxury<br />market, clearly ranked.</h1>
          <p className="hero-copy">Find the right car with price, condition and confidence in one view.</p>
          <a className="hero-cta" href="#discover">Explore the market <span aria-hidden="true">↓</span></a>
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
          <label>
            <span>Body type</span>
            <select value={bodyType} onChange={(event) => setBodyType(event.target.value)}>
              <option value="">All types</option>
              {BODY_TYPES.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Fuel type</span>
            <select value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
              <option value="">Any fuel</option>
              {FUEL_TYPES.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <button className="filter-action" type="button" onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>
            Show ranked cars <span aria-hidden="true">→</span>
          </button>
        </div>

        <section className="finance-calculator" aria-labelledby="finance-title">
          <div className="finance-intro">
            <p className="eyebrow">Finance planner</p>
            <h3 id="finance-title">Know the monthly number before you shortlist.</h3>
            <p>Pre-owned car loans commonly sit around <strong>9.5%–14.5% p.a.</strong>, subject to your profile, vehicle age and lender.</p>
          </div>
          <div className="finance-fields">
            <label><span>Down payment</span><div><b>₹</b><input inputMode="decimal" value={downPayment} onChange={(event) => setDownPayment(event.target.value.replace(/[^0-9.]/g, ""))} /><em>lakh</em></div></label>
            <label><span>Loan amount</span><div><b>₹</b><input inputMode="decimal" value={loanAmount} onChange={(event) => setLoanAmount(event.target.value.replace(/[^0-9.]/g, ""))} /><em>lakh</em></div></label>
            <label><span>Interest rate</span><div><input inputMode="decimal" value={interestRate} onChange={(event) => setInterestRate(event.target.value.replace(/[^0-9.]/g, ""))} /><em>% p.a.</em></div></label>
            <label><span>Term</span><div><select value={loanYears} onChange={(event) => setLoanYears(event.target.value)}><option value="3">3 years</option><option value="4">4 years</option><option value="5">5 years</option><option value="6">6 years</option><option value="7">7 years</option></select></div></label>
          </div>
          <div className="finance-result">
            <span>Estimated EMI</span>
            <strong>₹{rupees(monthlyEmi(Number(loanAmount || 0), Number(interestRate || 0), Number(loanYears || 1)))}</strong>
            <small>per month</small>
            <button type="button" onClick={() => setMaxMonthlyEmi(String(Math.round(monthlyEmi(Number(loanAmount || 0), Number(interestRate || 0), Number(loanYears || 1)))))}>Show cars at this EMI <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <div className="source-strip" aria-label="Market sources">
          <span>Connected now</span>
          <button className={!source ? "source-active" : ""} type="button" onClick={() => setSource("")}>All <b>{allListings.length}</b></button>
          {Array.from(new Set(allListings.map((listing) => listing.source))).map((item) => (
            <button className={source === item ? "source-active" : ""} type="button" onClick={() => setSource(item)} key={item}>{item} <b>{allListings.filter((listing) => listing.source === item).length}</b></button>
          ))}
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
            <label className="sort-control"><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="score">Best deal score</option><option value="year-new">Latest year</option><option value="kms-low">Kilometres: low to high</option><option value="kms-high">Kilometres: high to low</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            {(brand || model || year || kilometres || bodyType || fuelType || source || maxMonthlyEmi) && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>

        <div className="prototype-note">
          <span>V1 market preview</span>
          Prices and photos come from the source listings. Fair-value ranges and scores are illustrative until the model is trained on sufficient historical data.
        </div>

        <div className="listing-list">
          {filteredListings.slice(0, visibleCount).map((listing, index) => (
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
                {listing.alsoListedOn?.length ? <p className="also-listed">Also listed on {listing.alsoListedOn.map((item, index) => <a href={item.sourceUrl} target="_blank" rel="noreferrer" key={item.sourceUrl}>{index ? ", " : ""}{item.source}</a>)}</p> : null}
                <div className="price-row">
                  <div><span>Asking price</span><strong>{money(listing.price)}</strong></div>
                  <div><span>Estimated fair range</span><strong>{money(listing.fairLow)}–{money(listing.fairHigh)}</strong></div>
                  <div className="card-emi"><span>Est. EMI*</span><strong>₹{rupees(monthlyEmi(Math.max(0, listing.price - Number(downPayment || 0)), Number(interestRate || 0), Number(loanYears || 1)))}/mo</strong></div>
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

        {filteredListings.length > visibleCount && (
          <div className="load-more"><span>Showing {visibleCount} of {filteredListings.length} cars</span><button type="button" onClick={() => setVisibleCount((current) => current + 12)}>Show 12 more <span aria-hidden="true">↓</span></button></div>
        )}

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
        <button type="button" onClick={() => { setAlertSaved(false); setAlertOpen(true); }}><span className="alert-button-icon" aria-hidden="true">◌</span> Set a personalised alert <span className="button-arrow" aria-hidden="true">→</span></button>
      </section>

      <footer>
        <a className="brand-mark footer-brand" href="#top"><span className="brand-symbol" aria-hidden="true"><i /><i /></span><span>DRIVEWORTHY</span></a>
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
