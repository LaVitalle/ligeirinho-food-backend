import { sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { institutionsSchema } from "../../../institutions/infra/schemas/institution.schema";

export const canteensSchema = pgTable("canteens", {
  id: uuid("id").primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .notNull()
    .references(() => institutionsSchema.id),
  name: varchar("name", { length: 150 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  block: varchar("block", { length: 50 }),
  room: varchar("room", { length: 50 }),
  logoUrl: text("logo_url"),
  isOpen: boolean("is_open").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
