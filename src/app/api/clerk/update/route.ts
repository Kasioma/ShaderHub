import type { CredentialChange } from "@/utilities/zod/parsers";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.formData();
  const userId = data.get("userId") as string;
  const username = data.get("username") as string;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    const updateParams: CredentialChange = {
      username: user.username ?? "",
    };

    if (username && username.trim() !== "") updateParams.username = username;

    const response = await clerk.users.updateUser(userId, updateParams);

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
