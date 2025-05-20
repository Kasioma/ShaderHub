import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const id = data.get("file") as string;

  const response = await fetch(`${env.FILESTORAGE_URL}/object/${id}`, {
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

  const zipBuffer = await response.arrayBuffer();
  try {
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=object.zip",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(null, { status: 500 });
  }
}
