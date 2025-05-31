import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const data = await req.formData();
  const id = data.get("file") as string;

  const response = await fetch(`${env.FILESTORAGE_URL}/object/${id}`, {
    method: "DELETE",
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

  console.log("Delete successful, returning success to client");
  return NextResponse.json({ success: true });
}
