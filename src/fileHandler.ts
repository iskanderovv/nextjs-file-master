import type { NextRequest } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import type { UploadConfig, UploadedFile, UploadResult } from "./types"
import {
  ensureDirectoryExists,
  generateUniqueFilename,
  isImageFile,
  getMimeType,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
} from "./utils"
import { ImageProcessor, type ImageProcessingOptions } from "./imageProcessor"
import { FileRouter, type FileRoutingConfig } from "./fileRouter"

const DEFAULT_CONFIG: Required<UploadConfig> = {
  maxFileSize: 5, // 5MB
  allowedImageTypes: IMAGE_TYPES,
  allowedDocTypes: DOCUMENT_TYPES,
  convertToWebP: true,
  quality: 80,
  uploadDir: "uploads",
  docsDir: "docs",
  generateThumbnails: false,
  thumbnailSize: 200,
  generateResponsive: false,
  responsiveSizes: [400, 800, 1200],
}

export class FileUploadHandler {
  private config: Required<UploadConfig>
  private imageProcessor: ImageProcessor
  private fileRouter: FileRouter

  constructor(config: UploadConfig = {}, routingConfig?: FileRoutingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.imageProcessor = new ImageProcessor(this.config)
    this.fileRouter = new FileRouter(this.config, routingConfig)
  }

  async handleUpload(request: NextRequest, routeHint?: string): Promise<UploadResult> {
    try {
      const formData = await request.formData()
      const files = formData.getAll("files") as File[]
      const route = (formData.get("route") as string) || routeHint

      if (files.length === 0) {
        return {
          success: false,
          error: "No files provided",
        }
      }

      const uploadedFiles: UploadedFile[] = []

      for (const file of files) {
        const result = await this.processFile(file, route)
        if (result) {
          uploadedFiles.push(result)
        }
      }

      if (uploadedFiles.length === 0) {
        return {
          success: false,
          error: "No valid files were uploaded",
        }
      }

      return {
        success: true,
        files: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      }
    }
  }

  private async processFile(file: File, routeHint?: string): Promise<UploadedFile | null> {
    // Determine the appropriate route for this file
    const route = this.fileRouter.determineRoute(file, routeHint)

    if (!route) {
      throw new Error(`No suitable route found for file ${file.name}`)
    }

    // Validate file against route requirements
    const validation = this.fileRouter.validateFileForRoute(file, route)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const mimeType = file.type || getMimeType(file.name)
    const isImage = isImageFile(mimeType)

    // Generate filename and paths
    const shouldConvertToWebP = isImage && this.config.convertToWebP && mimeType !== "image/webp"
    const filename = generateUniqueFilename(file.name, shouldConvertToWebP)
    const filePath = this.fileRouter.getUploadPath(route, filename)
    const publicUrl = this.fileRouter.getPublicUrl(route, filename)

    // Ensure directory exists
    await ensureDirectoryExists(path.dirname(filePath))

    // Process and save file
    const buffer = Buffer.from(await file.arrayBuffer())
    let metadata

    if (shouldConvertToWebP) {
      metadata = await this.imageProcessor.getImageMetadata(buffer)
      await this.convertAndSaveImage(buffer, filePath)
    } else {
      if (isImage) {
        metadata = await this.imageProcessor.getImageMetadata(buffer)
      }
      await writeFile(filePath, buffer)
    }

    const uploadedFile: UploadedFile = {
      filename,
      originalName: file.name,
      size: file.size,
      type: shouldConvertToWebP ? "image/webp" : mimeType,
      path: filePath,
      url: publicUrl,
      isImage: isImage,
      metadata: metadata
        ? {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
          }
        : undefined,
    }

    // Generate thumbnail if requested and it's an image
    if (this.config.generateThumbnails && isImage) {
      const thumbnailFilename = filename.replace(/\.[^/.]+$/, "_thumb.webp")
      const thumbnailPath = this.fileRouter.getUploadPath(
        this.fileRouter.getRouteConfig("thumbnails") || route,
        thumbnailFilename,
      )

      await ensureDirectoryExists(path.dirname(thumbnailPath))
      await this.imageProcessor.createThumbnail(buffer, thumbnailPath, this.config.thumbnailSize)

      uploadedFile.thumbnail = {
        path: thumbnailPath,
        url: this.fileRouter.getPublicUrl(this.fileRouter.getRouteConfig("thumbnails") || route, thumbnailFilename),
      }
    }

    // Generate responsive images if requested and it's an image
    if (this.config.generateResponsive && isImage) {
      const responsiveImages = await this.imageProcessor.generateResponsiveSizes(
        buffer,
        filePath,
        this.config.responsiveSizes,
      )
      uploadedFile.responsive = responsiveImages
    }

    return uploadedFile
  }

  private async convertAndSaveImage(buffer: Buffer, filePath: string): Promise<void> {
    const metadata = await this.imageProcessor.getImageMetadata(buffer)

    // Determine optimal processing options based on image characteristics
    const processingOptions: ImageProcessingOptions = {
      quality: this.config.quality,
      format: "webp",
      progressive: true,
    }

    // Apply size limits for very large images
    if (metadata.width && metadata.width > 2048) {
      processingOptions.width = 2048
    }
    if (metadata.height && metadata.height > 2048) {
      processingOptions.height = 2048
    }

    await this.imageProcessor.processImage(buffer, filePath, processingOptions)
  }

  // Get available routes
  getAvailableRoutes(): string[] {
    return this.fileRouter.getAvailableRoutes()
  }

  // Static method for easy usage
  static async upload(request: NextRequest, config?: UploadConfig, routeHint?: string): Promise<UploadResult> {
    const handler = new FileUploadHandler(config)
    return handler.handleUpload(request, routeHint)
  }
}
