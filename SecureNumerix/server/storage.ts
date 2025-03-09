import { users, numbers, type User, type InsertUser, type Number, type InsertNumber } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Number operations
  getNumbers(userId: number): Promise<Number[]>;
  createNumber(number: InsertNumber & { userId: number }): Promise<Number>;
  deleteNumber(id: number, userId: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (err) {
      console.error('Error getting user:', err);
      throw err;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (err) {
      console.error('Error getting user by username:', err);
      throw err;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  async getNumbers(userId: number): Promise<Number[]> {
    try {
      return await db.select().from(numbers).where(eq(numbers.userId, userId));
    } catch (err) {
      console.error('Error getting numbers:', err);
      throw err;
    }
  }

  async createNumber(data: InsertNumber & { userId: number }): Promise<Number> {
    try {
      const [number] = await db.insert(numbers).values(data).returning();
      return number;
    } catch (err) {
      console.error('Error creating number:', err);
      throw err;
    }
  }

  async deleteNumber(id: number, userId: number): Promise<void> {
    try {
      await db.delete(numbers).where(
        and(eq(numbers.id, id), eq(numbers.userId, userId))
      );
    } catch (err) {
      console.error('Error deleting number:', err);
      throw err;
    }
  }
}

export const storage = new DatabaseStorage();