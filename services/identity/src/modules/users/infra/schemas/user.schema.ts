import { sql } from "drizzle-orm";
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { institutionsSchema } from "../../../institutions/infra/schemas/institution.schema";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "INSTITUTION_ADMIN",
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
    institutionId: uuid("institution_id").references(
      () => institutionsSchema.id,
    ),
    // TODO: virar references(canteensSchema.id) quando BE-09 criar o módulo canteens
    canteenId: uuid("canteen_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_users_email_unique_active")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
    check(
      "check_user_role_consistency",
      sql`(
        (${table.role} = 'ADMIN'::user_role AND ${table.institutionId} IS NULL AND ${table.canteenId} IS NULL)
        OR (${table.role} = 'INSTITUTION_ADMIN'::user_role AND ${table.institutionId} IS NOT NULL AND ${table.canteenId} IS NULL)
        OR (${table.role} = 'CUSTOMER'::user_role AND ${table.institutionId} IS NOT NULL AND ${table.canteenId} IS NULL)
        OR (${table.role} = 'SELLER'::user_role AND ${table.institutionId} IS NOT NULL AND ${table.canteenId} IS NOT NULL)
      )`,
    ),
  ],
);
