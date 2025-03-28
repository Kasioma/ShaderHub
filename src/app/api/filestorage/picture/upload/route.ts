import { env } from "@/env";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return new Response("Unauthorized", { status: 401 });

  const data = await req.formData();

  const response = await fetch(env.FILESTORAGE_URL + "/picture", {
    method: "POST",
    body: data,
  });
  if (!response.ok) {
    const body = response.body;

    if (response.status >= 500)
      console.log("Server error when uploading a file", {
        status: response.status,
        body: body,
      });

    return NextResponse.json(null, { status: response.status });
  }

  const json = (await response.json()) as { id: string };

  try {
    return NextResponse.json(json);
  } catch (error) {
    console.error(error);
    return NextResponse.json(null, { status: 500 });
  }
}
