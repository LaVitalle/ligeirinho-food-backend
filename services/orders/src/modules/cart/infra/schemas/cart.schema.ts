import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const cartItemsSchema = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItemExtrasSchema = pgTable(
  "cart_item_extras",
  {
    cartItemId: uuid("cart_item_id")
      .notNull()
      .references(() => cartItemsSchema.id, { onDelete: "cascade" }),
    extraId: uuid("extra_id").notNull(),
    extraNameSnapshot: text("extra_name_snapshot").notNull().default(""),
    extraPriceSnapshot: numeric("extra_price_snapshot", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),
  },
  (table) => [primaryKey({ columns: [table.cartItemId, table.extraId] })],
);
