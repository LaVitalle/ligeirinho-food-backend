import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { usersSchema } from "../../../users/infra/schemas/user.schema";
import { canteensSchema } from "../../../canteens/infra/schemas/canteen.schema";
import { productsSchema } from "../../../products/infra/schemas/product.schema";
import { extrasSchema } from "../../../extras/infra/schemas/extra.schema";

export const orderStatusEnum = pgEnum("order_status", [
  "AGUARDANDO",
  "EM_PREPARO",
  "PRONTO",
  "AGUARDANDO_RETIRADA",
  "RETIRADO",
  "CANCELADO",
]);

export const ordersSchema = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersSchema.id),
  canteenId: uuid("canteen_id")
    .notNull()
    .references(() => canteensSchema.id),
  status: orderStatusEnum("status").notNull().default("AGUARDANDO"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsSchema = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersSchema.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsSchema.id),
  productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
  unitPriceAtPurchase: numeric("unit_price_at_purchase", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  note: text("note"),
});

export const orderItemExtrasSchema = pgTable("order_item_extras", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderItemId: uuid("order_item_id")
    .notNull()
    .references(() => orderItemsSchema.id),
  extraId: uuid("extra_id")
    .notNull()
    .references(() => extrasSchema.id),
  extraNameSnapshot: varchar("extra_name_snapshot", { length: 150 }).notNull(),
  unitPriceAtPurchase: numeric("unit_price_at_purchase", { precision: 10, scale: 2 }).notNull(),
});
