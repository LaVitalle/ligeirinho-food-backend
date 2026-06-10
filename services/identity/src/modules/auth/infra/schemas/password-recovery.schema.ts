import { sql } from "drizzle-orm";
import { boolean, char, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersSchema } from "../../../users/infra/schemas/user.schema";

export const passwordRecoverySchema = pgTable(
  "password_recovery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersSchema.id, { onDelete: "cascade" }),
    code: char("code", { length: 6 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isUsed: boolean("is_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_recovery_active_code")
      .on(table.code, table.userId)
      .where(sql`${table.isUsed} = false`),
  ],
);
