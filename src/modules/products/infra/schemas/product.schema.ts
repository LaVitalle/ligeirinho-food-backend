import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { canteensSchema } from "../../../canteens/infra/schemas/canteen.schema";
import { categoriesSchema } from "../../../categories/infra/schemas/category.schema";

export const productsSchema = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  canteenId: uuid("canteen_id")
    .notNull()
    .references(() => canteensSchema.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categoriesSchema.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
