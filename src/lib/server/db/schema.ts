import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	real,
	serial,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
	vector,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: varchar("id", { length: 15 }).primaryKey(),
	name: text("name").notNull(),
	username: varchar("username", { length: 39 }).notNull().unique(),
	embedding: vector("embedding", { dimensions: 768 }),
	verified: boolean("verified").notNull().default(false),
	thumbnail: text("thumbnail"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	admin: boolean("admin").notNull().default(false),
});

// Users that have allowed to create an account but haven't yet.
//
// They will be present in `user`, but upon login this table will
// be checked and their password will be set to the one they log in with.
export const pendingUser = pgTable(
	"pending_user",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id)
			.primaryKey(),
		code: uuid("code").notNull(),
	},
	(table) => {
		return {
			codeIdx: index().on(table.code),
		};
	}
);

export const recipe = pgTable(
	"recipe",
	{
		id: serial("id").primaryKey(),
		authorId: text("author_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		embedding: vector({ dimensions: 768 }),
		title: text("title").notNull().unique(),
		thumbnail: text("thumbnail").notNull(),
		url: text("url"),
		ingredients: text("ingredients").array().notNull(),
		directions: text("directions").array().notNull(),
		notes: text("notes"),
		description: text("description"),
		tags: text("tags").array().notNull(),
		calories: real("calories").notNull(),
		fat: real("fat").notNull(),
		saturatedFat: real("saturated_fat").notNull(),
		protein: real("protein").notNull(),
		sodium: real("sodium").notNull(),
		sugar: real("sugar").notNull(),
		categoryId: integer("category_id").references(() => category.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		pending: boolean("pending").notNull().default(true),
	},
	(table) => {
		return {
			authorIdx: index().on(table.authorId),
			embeddingIdx: index().using("hnsw", table.embedding.op("vector_ip_ops")),
		};
	}
);

export const history = pgTable(
	"history",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		recipeId: integer("recipe_id")
			.notNull()
			.references(() => recipe.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => {
		return {
			userIdx: index().on(table.userId),
			recipeIdx: index().on(table.recipeId),
		};
	}
);

export const category = pgTable(
	"category",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => {
		return {
			userIdxNameIdx: unique().on(table.userId, table.name),
		};
	}
);

export const subscription = pgTable(
	"subscription",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		channelId: text("channel_id")
			.notNull()
			.references(() => user.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => {
		return {
			userIdx: index().on(table.userId),
			channelIdx: index().on(table.channelId),
		};
	}
);

export const like = pgTable(
	"like",
	{
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		recipeId: integer("recipe_id")
			.notNull()
			.references(() => recipe.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => {
		return {
			userIdx: index().on(table.userId),
			recipeIdx: index().on(table.recipeId),
			userRecipePkey: primaryKey({ columns: [table.userId, table.recipeId] }),
		};
	}
);

export const userKey = pgTable("user_key", {
	id: varchar("id", { length: 255 }).primaryKey(),
	userId: varchar("user_id", { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	password: varchar("hashed_password", { length: 255 }),
});

export const userSession = pgTable("user_session", {
	id: varchar("id", { length: 128 }).primaryKey(),
	userId: varchar("user_id", { length: 15 })
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	activeExpires: bigint("active_expires", { mode: "number" }).notNull(),
	idleExpires: bigint("idle_expires", { mode: "number" }).notNull(),
});
