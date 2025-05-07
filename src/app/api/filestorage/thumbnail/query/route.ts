import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.formData();

  const response = await fetch(`${env.FILESTORAGE_URL}/thumbnails`, {
    method: "POST",
    body: data,
  });
  if (!response.ok) {
    const body = response.body;

    if (response.status >= 500)
      console.log("Server error when querying thumbnails", {
        status: response.status,
        body: body,
      });

    return NextResponse.json(null, { status: response.status });
  }

  try {
    return NextResponse.json(null, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(null, { status: 500 });
  }
}
