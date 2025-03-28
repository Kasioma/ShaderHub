import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { logger } from "hono/logger";
import { nanoid } from "nanoid";
import { serve } from "@hono/node-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_PATH = path.join(__dirname, "..", "static");
const STATIC_PATH_PICTURES = path.join(__dirname, "..", "static", "pictures");
const STATIC_PATH_OBJECTS = path.join(__dirname, "..", "static", "files");

const app = new Hono();
app.use(logger());
app.use("/static/*", serveStatic({ root: "./" }));

app.post("/picture", async (c) => {
  const data = await c.req.formData();
  const blob = data.get("file") as Blob;
  const buffer = Buffer.from(await blob.arrayBuffer());
  const id = nanoid(15);

  if (!fs.existsSync(STATIC_PATH)) {
    fs.mkdirSync(STATIC_PATH, { recursive: true });
  }

  if (!fs.existsSync(STATIC_PATH_PICTURES)) {
    fs.mkdirSync(STATIC_PATH_PICTURES, { recursive: true });
  }

  fs.writeFileSync(path.join(STATIC_PATH_PICTURES, id), buffer);

  return c.json({ id });
});

app.post("/object", async (c) => {
  const data = await c.req.formData();
  const blob = data.get("file") as Blob;
  const buffer = Buffer.from(await blob.arrayBuffer());
  const id = nanoid(15);

  if (!fs.existsSync(STATIC_PATH)) {
    fs.mkdirSync(STATIC_PATH, { recursive: true });
  }

  if (!fs.existsSync(STATIC_PATH_OBJECTS)) {
    fs.mkdirSync(STATIC_PATH_OBJECTS, { recursive: true });
  }

  fs.writeFileSync(path.join(STATIC_PATH_OBJECTS, id), buffer);

  return c.json({ id });
});

app.delete("/pictures/:id", async (c) => {
  const fileId = c.req.param("id");
  const filePath = path.join(STATIC_PATH_PICTURES, fileId);

  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);

  fs.unlinkSync(filePath);

  return c.body("", 200);
});

app.delete("/objects/:id", async (c) => {
  const fileId = c.req.param("id");
  const filePath = path.join(STATIC_PATH_OBJECTS, fileId);

  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);

  fs.unlinkSync(filePath);

  return c.body("", 200);
});

serve({
  fetch: app.fetch,
  port: 3001,
});
