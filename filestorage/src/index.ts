import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { logger } from "hono/logger";
import { nanoid } from "nanoid";
import { serve } from "@hono/node-server";
import archiver from "archiver";
import { PassThrough } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATIC_PATH = path.join(__dirname, "..", "static");
const STATIC_PATH_PICTURES = path.join(__dirname, "..", "static", "pictures");
const STATIC_PATH_OBJECTS = path.join(__dirname, "..", "static", "files");
const STATIC_PATH_THUMBNAILS = path.join(
  __dirname,
  "..",
  "static",
  "thumbnails",
);

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
  const id = data.get("objectId") as string;
  const thumbnail = data.get("thumbnail") as Blob;
  const objectBuffer = Buffer.from(await blob.arrayBuffer());
  const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());

  if (!fs.existsSync(STATIC_PATH)) {
    fs.mkdirSync(STATIC_PATH, { recursive: true });
  }

  if (!fs.existsSync(STATIC_PATH_OBJECTS)) {
    fs.mkdirSync(STATIC_PATH_OBJECTS, { recursive: true });
  }

  if (!fs.existsSync(STATIC_PATH_THUMBNAILS)) {
    fs.mkdirSync(STATIC_PATH_THUMBNAILS, { recursive: true });
  }

  try {
    fs.writeFileSync(path.join(STATIC_PATH_OBJECTS, id), objectBuffer);
    fs.writeFileSync(path.join(STATIC_PATH_THUMBNAILS, id), thumbnailBuffer);
  } catch {
    try {
      fs.unlinkSync(path.join(STATIC_PATH_OBJECTS, id));
    } catch {
      return c.json({ error: "Failed to upload thumbnail" }, 500);
    }
    return c.json({ error: "Failed to upload object" }, 500);
  }

  return c.json({ success: true }, 200);
});

app.post("/object/:id", async (c) => {
  const fileId = c.req.param("id");
  const filePath = path.join(STATIC_PATH_OBJECTS, fileId);

  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);

  const file = fs.readFileSync(filePath);
  return c.body(file);
});

app.delete("/picture/:id", async (c) => {
  const fileId = c.req.param("id");
  const filePath = path.join(STATIC_PATH_PICTURES, fileId);

  if (!fs.existsSync(filePath)) return c.json({ error: "Not found" }, 404);

  fs.unlinkSync(filePath);

  return c.body("", 200);
});

app.delete("/object/:id", async (c) => {
  const id = c.req.param("id");
  const filePath = path.join(STATIC_PATH_OBJECTS, id);
  const thumbnailPath = path.join(STATIC_PATH_THUMBNAILS, id);

  try {
    fs.unlinkSync(filePath);
    fs.unlinkSync(thumbnailPath);
  } catch {
    return c.json({ error: "Failed to delete object" }, 500);
  }

  return c.json({ success: true }, 200);
});

app.post("/thumbnails", async (c) => {
  const data = await c.req.formData();
  const thumbnails = data.getAll("thumbnails");

  if (!fs.existsSync(STATIC_PATH_THUMBNAILS)) {
    return c.json({ error: "Thumbnails folder not found" }, 404);
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();

  archive.pipe(stream);

  for (const thumb of thumbnails) {
    const name = typeof thumb === "string" ? thumb : thumb.name;
    const filePath = path.join(STATIC_PATH_THUMBNAILS, name);
    if (!fs.existsSync(filePath)) {
      archive.append(`File ${name} not found`, { name: `ERROR_${name}.txt` });
    } else {
      archive.file(filePath, { name });
    }
  }

  await archive.finalize();

  return new Response(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=thumbnails.zip",
    },
  });
});

serve({
  fetch: app.fetch,
  port: 3001,
});
