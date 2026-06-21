import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const paymentMethodTypeEnum = pgEnum("payment_method_type", [
  "PIX",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "CASH",
  "DIGITAL_WALLET",
]);

export const paymentMethodsSchema = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  type: paymentMethodTypeEnum("type").notNull(),
  iconKey: varchar("icon_key", { length: 50 }),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
