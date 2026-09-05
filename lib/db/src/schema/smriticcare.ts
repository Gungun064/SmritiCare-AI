import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable(
  "smriticcare_user_profiles",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    preferredLanguage: varchar("preferred_language", { length: 16 })
      .notNull()
      .default("English"),
    caregiverName: text("caregiver_name"),
    relationship: text("relationship"),
    shareMemory: boolean("share_memory").notNull().default(false),
    connectionCode: varchar("connection_code", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIndex: uniqueIndex("smriticcare_user_profiles_user_id_idx").on(
      table.userId,
    ),
    connectionCodeIndex: uniqueIndex(
      "smriticcare_user_profiles_connection_code_idx",
    ).on(table.connectionCode),
  }),
);

export const gameResultsTable = pgTable(
  "smriticcare_game_results",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    game: varchar("game", { length: 80 }).notNull(),
    score: integer("score").notNull(),
    accuracy: integer("accuracy").notNull(),
    mistakes: integer("mistakes").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    difficulty: integer("difficulty").notNull().default(1),
    completionTime: integer("completion_time").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    localDateIst: varchar("local_date_ist", { length: 10 }).notNull(),
    syncStatus: varchar("sync_status", { length: 20 })
      .notNull()
      .default("synced"),
  },
  (table) => ({
    userDateIndex: index("smriticcare_game_results_user_date_idx").on(
      table.userId,
      table.localDateIst,
    ),
  }),
);

export const memoriesTable = pgTable(
  "smriticcare_memories",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIndex: index("smriticcare_memories_user_idx").on(table.userId),
  }),
);

export const storiesTable = pgTable(
  "smriticcare_stories",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: text("title").notNull(),
    people: text("people").notNull().default(""),
    place: text("place").notNull().default(""),
    year: text("year").notNull().default(""),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIndex: index("smriticcare_stories_user_idx").on(table.userId),
  }),
);

export const routinesTable = pgTable(
  "smriticcare_routines",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    dateKey: varchar("date_key", { length: 10 }).notNull(),
    time: varchar("time", { length: 10 }).notNull(),
    label: text("label").notNull(),
    detail: text("detail").notNull().default(""),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIndex: index("smriticcare_routines_user_date_idx").on(
      table.userId,
      table.dateKey,
    ),
  }),
);

export const caregiverConnectionsTable = pgTable(
  "smriticcare_caregiver_connections",
  {
    id: serial("id").primaryKey(),
    caregiverUserId: varchar("caregiver_user_id", { length: 255 }).notNull(),
    elderUserId: varchar("elder_user_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    caregiverElderIndex: uniqueIndex(
      "smriticcare_caregiver_elder_idx",
    ).on(table.caregiverUserId, table.elderUserId),
  }),
);

export const insertUserProfileSchema = createInsertSchema(userProfilesTable);
export const insertGameResultSchema = createInsertSchema(gameResultsTable).omit(
  {
    id: true,
    createdAt: true,
  },
);
export const insertMemorySchema = createInsertSchema(memoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertStorySchema = createInsertSchema(storiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRoutineSchema = createInsertSchema(routinesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const profileRoleSchema = z.enum(["elder", "caregiver"]);
export const languageSchema = z.enum(["English", "Hindi"]);

export type UserProfile = typeof userProfilesTable.$inferSelect;
export type GameResult = typeof gameResultsTable.$inferSelect;
export type Memory = typeof memoriesTable.$inferSelect;
export type Story = typeof storiesTable.$inferSelect;
export type Routine = typeof routinesTable.$inferSelect;