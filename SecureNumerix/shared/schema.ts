import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const numbers = pgTable("numbers", {
  id: serial("id").primaryKey(),
  value: integer("value").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNumberSchema = createInsertSchema(numbers).pick({
  value: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Number = typeof numbers.$inferSelect;
export type InsertNumber = z.infer<typeof insertNumberSchema>;
