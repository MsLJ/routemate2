import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Places table - 사용자가 추가한 핫플레이스
 */
export const places = mysqlTable("places", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "restaurant",
    "cafe",
    "hotplace",
    "boardgame",
    "escape",
    "popup",
  ]).notNull(),
  address: text("address"),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Place = typeof places.$inferSelect;
export type InsertPlace = typeof places.$inferInsert;

/**
 * Routes table - 사용자가 만든 루트
 */
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  likeCount: int("likeCount").default(0).notNull(),
  saveCount: int("saveCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

/**
 * Route-Place junction table - 루트에 포함된 장소들
 */
export const routePlaces = mysqlTable("route_places", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull(),
  placeId: int("placeId").notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoutePlace = typeof routePlaces.$inferSelect;
export type InsertRoutePlace = typeof routePlaces.$inferInsert;

/**
 * Favorites table - 사용자가 좋아요한 루트
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routeId: int("routeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Saves table - 사용자가 저장한 루트
 */
export const saves = mysqlTable("saves", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routeId: int("routeId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Save = typeof saves.$inferSelect;
export type InsertSave = typeof saves.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  places: many(places),
  routes: many(routes),
  favorites: many(favorites),
  saves: many(saves),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  user: one(users, { fields: [places.userId], references: [users.id] }),
  routePlaces: many(routePlaces),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  user: one(users, { fields: [routes.userId], references: [users.id] }),
  routePlaces: many(routePlaces),
  favorites: many(favorites),
  saves: many(saves),
}));

export const routePlacesRelations = relations(routePlaces, ({ one }) => ({
  route: one(routes, { fields: [routePlaces.routeId], references: [routes.id] }),
  place: one(places, { fields: [routePlaces.placeId], references: [places.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  route: one(routes, { fields: [favorites.routeId], references: [routes.id] }),
}));

export const savesRelations = relations(saves, ({ one }) => ({
  user: one(users, { fields: [saves.userId], references: [users.id] }),
  route: one(routes, { fields: [saves.routeId], references: [routes.id] }),
}));

/**
 * Comments table - 루트 에 관한 댓글
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routeId: int("routeId").notNull(),
  parentId: int("parentId"), // For replies
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Comment Likes junction table
 */
export const commentLikes = mysqlTable("comment_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  commentId: int("commentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Follows table - many-to-many user relationship
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // recipient
  senderId: int("senderId").notNull(), // performer
  type: varchar("type", { length: 50 }).notNull(), // 'comment' | 'reply' | 'follow' | 'activity'
  routeId: int("routeId"),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 for false, 1 for true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

/**
 * Route Activities table - "이 루트 따라가봤어요" 방문 인증 내역
 */
export const routeActivities = mysqlTable("route_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  routeId: int("routeId").notNull(),
  verified: int("verified").default(0).notNull(), // 0: no verification, 1: receipt verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouteActivity = typeof routeActivities.$inferSelect;

// Relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  route: one(routes, { fields: [comments.routeId], references: [routes.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "replies" }),
  replies: many(comments, { relationName: "replies" }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "user_following" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "user_followers" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  sender: one(users, { fields: [notifications.senderId], references: [users.id] }),
  route: one(routes, { fields: [notifications.routeId], references: [routes.id] }),
}));

export const routeActivitiesRelations = relations(routeActivities, ({ one }) => ({
  user: one(users, { fields: [routeActivities.userId], references: [users.id] }),
  route: one(routes, { fields: [routeActivities.routeId], references: [routes.id] }),
}));


// TODO: Add additional tables as your schema grows