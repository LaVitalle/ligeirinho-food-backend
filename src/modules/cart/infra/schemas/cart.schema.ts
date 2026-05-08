import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersSchema } from "../../../users/infra/schemas/user.schema";
import { productsSchema } from "../../../products/infra/schemas/product.schema";
import { extrasSchema } from "../../../extras/infra/schemas/extra.schema";

export const cartItemsSchema = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersSchema.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsSchema.id),
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
    extraId: uuid("extra_id")
      .notNull()
      .references(() => extrasSchema.id),
  },
  (table) => [primaryKey({ columns: [table.cartItemId, table.extraId] })],
);
