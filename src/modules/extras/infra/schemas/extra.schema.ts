import {
  boolean,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { canteensSchema } from "../../../canteens/infra/schemas/canteen.schema";
import { productsSchema } from "../../../products/infra/schemas/product.schema";

export const extrasSchema = pgTable("extras", {
  id: uuid("id").primaryKey().defaultRandom(),
  canteenId: uuid("canteen_id")
    .notNull()
    .references(() => canteensSchema.id),
  name: varchar("name", { length: 150 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const productExtrasSchema = pgTable(
  "product_extras",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => productsSchema.id),
    extraId: uuid("extra_id")
      .notNull()
      .references(() => extrasSchema.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.extraId] })],
);

export const productRemovableIngredientsSchema = pgTable(
  "product_removable_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => productsSchema.id),
    name: varchar("name", { length: 100 }).notNull(),
  },
);
