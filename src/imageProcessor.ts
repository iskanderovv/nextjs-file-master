import sharp from "sharp"
import type { UploadConfig } from "./types"

export interface ImageProcessingOptions {
  quality?: number
  width?: number
  height?: number
  fit?: "cover" | "contain" | "fill" | "inside" | "outside"
  format?: "webp" | "jpeg" | "png"
  progressive?: boolean
}

export class ImageProcessor {
  private config: Required<UploadConfig>

  constructor(config: Required<UploadConfig>) {
    this.config = config
  }

  async processImage(buffer: Buffer, outputPath: string, options: ImageProcessingOptions = {}): Promise<void> {
    let sharpInstance = sharp(buffer)

    // Resize if dimensions provided
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || "cover",
        withoutEnlargement: true,
      })
    }

    // Apply format-specific optimizations
    const format = options.format || "webp"
    const quality = options.quality || this.config.quality

    switch (format) {
      case "webp":
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 6, // Higher effort for better compression
        })
        break

      case "jpeg":
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: options.progressive || true,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        })
        break

      case "png":
        sharpInstance = sharpInstance.png({
          quality,
          progressive: options.progressive || true,
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        break
    }

    await sharpInstance.toFile(outputPath)
  }

  async createThumbnail(buffer: Buffer, outputPath: string, size = 200): Promise<void> {
    await sharp(buffer)
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(outputPath)
  }

  async getImageMetadata(buffer: Buffer) {
    const metadata = await sharp(buffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels,
    }
  }

  // Generate multiple sizes for responsive images
  async generateResponsiveSizes(
    buffer: Buffer,
    basePath: string,
    sizes: number[] = [400, 800, 1200, 1600],
  ): Promise<Array<{ size: number; path: string; url: string }>> {
    const results = []

    for (const size of sizes) {
      const filename = basePath.replace(/\.[^/.]+$/, `_${size}w.webp`)
      await this.processImage(buffer, filename, {
        width: size,
        format: "webp",
        quality: this.config.quality,
      })

      results.push({
        size,
        path: filename,
        url: filename.replace(process.cwd() + "/public", ""),
      })
    }

    return results
  }
}
