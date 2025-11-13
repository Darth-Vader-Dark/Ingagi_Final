import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const files: File[] = data.getAll("files") as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), "public", "uploads", "rooms")
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles: string[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomString}.${fileExtension}`
      
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      
      // Store the public URL
      uploadedFiles.push(`/uploads/rooms/${filename}`)
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to upload files"
    }, { status: 500 })
  }
}
