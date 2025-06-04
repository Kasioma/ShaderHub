import { type InferSelectModel } from "drizzle-orm";
import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { type RequestType, type Visibility } from "@/utilities/types";

export const userTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
});

export type User = InferSelectModel<typeof userTable>;

export const objectTable = pgTable("objects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  visibility: text("visibility")
    .notNull()
    .$type<Visibility>()
    .default("private"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
});

export type Object = InferSelectModel<typeof objectTable>;

export const objectTagRelationTable = pgTable("object_tag_relations", {
  tagId: text("tag_id").references(() => tagTable.id, { onDelete: "cascade" }),
  objectId: text("object_id").references(() => objectTable.id, {
    onDelete: "cascade",
  }),
});

export type ObjectTagRelation = InferSelectModel<typeof objectTagRelationTable>;

export const tagTable = pgTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  colour: text("colour").notNull().unique(),
  visibility: text("visibility")
    .notNull()
    .$type<Visibility>()
    .default("private"),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export type Tag = InferSelectModel<typeof tagTable>;

export const tagGroupTable = pgTable("tag_groups", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references(() => tagTable.id, {
    onDelete: "cascade",
  }),
});

export type TagGroup = InferSelectModel<typeof tagGroupTable>;

export const tagGroupTagRelationTable = pgTable("tag_group_tag_relations", {
  tagGroupId: text("tag_group_id").references(() => tagGroupTable.id, {
    onDelete: "cascade",
  }),
  tagId: text("tag_id").references(() => tagTable.id, { onDelete: "cascade" }),
});

export type TagGroupTagRelation = InferSelectModel<
  typeof tagGroupTagRelationTable
>;

export const attributeTypeTable = pgTable("attribute_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export type AttributeType = InferSelectModel<typeof attributeTypeTable>;

export const attributeValueTable = pgTable("attribute_values", {
  id: text("id").primaryKey(),
  value: text("value").notNull(),
  attributeTypeId: text("attribute_type_id")
    .notNull()
    .references(() => attributeTypeTable.id, { onDelete: "cascade" }),
});

export type AttributeValue = InferSelectModel<typeof attributeValueTable>;

export const attributeTypeTagRelationTable = pgTable(
  "attribute_type_tag_relations",
  {
    tagId: text("tag_id").references(() => tagTable.id, {
      onDelete: "cascade",
    }),
    attributeId: text("attribute_type_id").references(
      () => attributeTypeTable.id,
      {
        onDelete: "cascade",
      },
    ),
  },
);

export type AttributeTypeTagRelation = InferSelectModel<
  typeof attributeTypeTagRelationTable
>;

export const attributeValueObjectRelationTable = pgTable(
  "attribute_value_object_relations",
  {
    objectId: text("object_id").references(() => objectTable.id, {
      onDelete: "cascade",
    }),
    attributeId: text("attribute_value_id").references(
      () => attributeValueTable.id,
      {
        onDelete: "cascade",
      },
    ),
  },
);

export type AttributeValueObjectRelation = InferSelectModel<
  typeof attributeValueObjectRelationTable
>;

export const searchHistoryTable = pgTable("search_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type SearchHistory = InferSelectModel<typeof searchHistoryTable>;

export const collectionsTable = pgTable(
  "collections",
  {
    objectId: text("object_id")
      .references(() => objectTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    tagId: text("tag_id")
      .references(() => tagTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    userId: text("user_id")
      .references(() => userTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.objectId, table.tagId, table.userId] }),
  ],
);

export const requestTable = pgTable("requests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  objectId: text("object_id")
    .notNull()
    .references(() => objectTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().$type<RequestType>().default("pending"),
  createdAt: integer("created_at").notNull(),
});
