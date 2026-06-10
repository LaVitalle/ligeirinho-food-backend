import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Projeção local dos produtos do catalog-service. Alimentada via consumo dos
 * eventos catalog:product.upserted / product.deleted. Permite que o orders
 * valide produto/preço/cantina sem consultar o banco do catalog.
 */
export const productsViewSchema = pgTable("products_view", {
  id: uuid("id").primaryKey(),
  canteenId: uuid("canteen_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
