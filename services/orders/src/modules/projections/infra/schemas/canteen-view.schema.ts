import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Projeção local das cantinas do catalog-service. Alimentada via consumo do
 * evento catalog:canteen.updated. Permite que o orders valide status
 * (aberta/fechada) e nome sem consultar o banco do catalog.
 */
export const canteensViewSchema = pgTable("canteens_view", {
  id: uuid("id").primaryKey(),
  institutionId: uuid("institution_id").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  isOpen: boolean("is_open").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
