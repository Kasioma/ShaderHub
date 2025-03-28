import { Webhook } from "svix";
import { headers } from "next/headers";
import { type WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { userTable } from "@/server/db/schema";
import { authSchema } from "@/utilities/zod/auth";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixSignature || !svixTimestamp) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as WebhookEvent;
  } catch (err) {
    console.error(err);
    return new Response("Invalid signature", { status: 400 });
  }

  const clerk = await clerkClient();
  switch (event.type) {
    case "user.created": {
      await clerk.users.updateUser(event.data.id, {
        publicMetadata: {
          roles: ["user"],
        },
      });
      const user = {
        id: event.data.id,
        username: event.data.username,
      };
      const validation = authSchema.safeParse(user);
      if (!validation.success) {
        return new Response("Invalid user schema", { status: 400 });
      }
      await db.insert(userTable).values(validation.data);
      break;
    }
  }

  return new Response("", { status: 200 });
}
