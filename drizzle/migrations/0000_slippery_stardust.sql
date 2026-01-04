CREATE TABLE "products" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"price" integer NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"image_url" text NOT NULL
);
