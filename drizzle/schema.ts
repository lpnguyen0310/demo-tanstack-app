import {pgTable,varchar,integer,text} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    price: integer("price").notNull(),
    likes: integer("likes").notNull().default(0),
    imageUrl: text("image_url").notNull(),
});