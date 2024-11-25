import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_CLOUDINARY_CLOUND_NAME,
  api_key: process.env.NEXT_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_CLOUDINARY_SECRET_KEY,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // const result = 

  } catch (error) {}
}
