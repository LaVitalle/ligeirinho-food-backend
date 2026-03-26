import { sql } from "drizzle-orm";
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "SELLER",
  "CUSTOMER",
]);

export const usersSchema = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    profilePhotoUrl: text("profile_photo_url"),
    role: userRoleEnum("role").notNull(),
    institutionId: uuid("institution_id"),
    canteenId: uuid("canteen_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("users_email_unique").on(table.email),
    check(
      "check_seller_has_canteen",
      sql`${table.role} <> 'SELLER'::user_role OR ${table.canteenId} IS NOT NULL`,
    ),
  ],
);
