import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  inventoryUrl: text("inventory_url").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  lastCompletedAt: text("last_completed_at"),
});

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  fingerprint: text("fingerprint").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  variant: text("variant").notNull().default(""),
  year: integer("year").notNull(),
  kilometres: integer("kilometres").notNull(),
  fuel: text("fuel").notNull().default(""),
  transmission: text("transmission").notNull().default(""),
  priceLakh: real("price_lakh").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("available"),
  firstSeenAt: text("first_seen_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
}, (table) => [
  uniqueIndex("listings_fingerprint_unique").on(table.fingerprint),
  index("listings_status_last_seen_idx").on(table.status, table.lastSeenAt),
]);

export const listingSources = sqliteTable("listing_sources", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id),
  sourceId: text("source_id").notNull().references(() => sources.id),
  sourceListingId: text("source_listing_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  askingPriceLakh: real("asking_price_lakh").notNull(),
  seenAt: text("seen_at").notNull(),
}, (table) => [
  uniqueIndex("listing_sources_source_listing_unique").on(table.sourceId, table.sourceListingId),
  index("listing_sources_listing_idx").on(table.listingId),
]);

export const importRuns = sqliteTable("import_runs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  status: text("status").notNull(),
  pagesRead: integer("pages_read").notNull().default(0),
  listingsSeen: integer("listings_seen").notNull().default(0),
  duplicateGroups: integer("duplicate_groups").notNull().default(0),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  message: text("message"),
});
