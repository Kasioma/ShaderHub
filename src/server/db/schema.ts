import { type InferSelectModel } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { type Visibility } from "@/utilities/lib/types";

export const userTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export type User = InferSelectModel<typeof userTable>;

export const tagTable = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  colour: text("colour").notNull().unique(),
  visibility: text("visibility")
    .notNull()
    .$type<Visibility>()
    .default("private"),
});

export type Tag = InferSelectModel<typeof tagTable>;

export const tagGroupTable = pgTable("tag_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export type TagGroup = InferSelectModel<typeof tagGroupTable>;

export const tagGroupRelationTable = pgTable("tag_group_relations", {
  tagId: text("tag_id")
    .notNull()
    .references(() => tagTable.id, { onDelete: "cascade" }),
  tagGroupId: text("tag_group_id")
    .notNull()
    .references(() => tagGroupTable.id, { onDelete: "cascade" }),
});

export type TagGroupRelation = InferSelectModel<typeof tagGroupRelationTable>;

export const attributeTable = pgTable("attributes", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: text("value").notNull(),
  visibility: text("visibility")
    .notNull()
    .$type<Visibility>()
    .default("private"),
});

export type Attribute = InferSelectModel<typeof attributeTable>;

export const attributeTagRelationTable = pgTable("attribute_tag_relations", {
  tagId: text("tag_id").references(() => tagTable.id, { onDelete: "cascade" }),
  attributeId: text("attribute_id").references(() => attributeTable.id, {
    onDelete: "cascade",
  }),
});

export type AttributeTagRelation = InferSelectModel<
  typeof attributeTagRelationTable
>;

export const objectTable = pgTable("objects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  visibility: text("visibility")
    .notNull()
    .$type<Visibility>()
    .default("private"),
});

export type Object = InferSelectModel<typeof objectTable>;

export const objectUserRelationTable = pgTable("object_user_relations", {
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  objectId: text("object_id").references(() => objectTable.id, {
    onDelete: "cascade",
  }),
});

export type ObjectUserRelation = InferSelectModel<
  typeof objectUserRelationTable
>;

export const objectTagRelationTable = pgTable("object_tag_relations", {
  tagId: text("tag_id").references(() => tagTable.id, { onDelete: "cascade" }),
  objectId: text("object_id").references(() => objectTable.id, {
    onDelete: "cascade",
  }),
});

export type ObjectTagRelation = InferSelectModel<typeof objectTagRelationTable>;
