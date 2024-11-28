import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_CLOUDINARY_SECRET_KEY,
});

interface CloudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any;
}

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    if(!process.env.NEXT_CLOUDINARY_CLOUND_NAME || 
       !process.env.NEXT_CLOUDINARY_API_KEY ||
       !process.env.NEXT_CLOUDINARY_SECRET_KEY
    ){
        return NextResponse.json({error: "Cloudinary credientials not found"})
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "video-upload",
            transformation: [
                {
                    quality: "auto", fetch_format: "mp4"
                }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result as CloudinaryUploadResult);
            }
          }
        );
        uploadStream.end(buffer);
      }
    );

    const video = prisma.video.create({
        data: {
            title,
            description,
            publicId: result.public_id,
            originalSize,
            compressedSize: String(result.bytes),
            duration: result.duration || 0
        }
    })

    return NextResponse.json({ video }, { status: 200 });
    
  } catch (error) {
    console.log("Upload video failed", error)
    return NextResponse.json({error: "Upload video failed" }, { status: 500 })
  }
  finally{
    await prisma.$disconnect()
  }
}
