import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { lookup } from "mime-types"

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
]

export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

export function generateUniqueFilename(originalName: string, convertToWebP = false): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = convertToWebP ? ".webp" : path.extname(originalName)
  const nameWithoutExt = path.basename(originalName, path.extname(originalName))

  return `${nameWithoutExt}_${timestamp}_${random}${ext}`
}

export function isImageFile(mimeType: string): boolean {
  return IMAGE_TYPES.includes(mimeType)
}

export function isDocumentFile(mimeType: string): boolean {
  return DOCUMENT_TYPES.includes(mimeType)
}

export function getMimeType(filename: string): string {
  return lookup(filename) || "application/octet-stream"
}
