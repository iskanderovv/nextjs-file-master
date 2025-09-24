import path from "path"
import type { UploadConfig } from "./types"
import { isImageFile, isDocumentFile } from "./utils"

export interface FileRoute {
  directory: string
  subdirectory?: string
  allowedTypes: string[]
  maxSize?: number
}

export interface FileRoutingConfig {
  routes: {
    [key: string]: FileRoute
  }
  defaultRoute?: string
  createSubdirectories?: boolean
}

export class FileRouter {
  private config: FileRoutingConfig
  private uploadConfig: Required<UploadConfig>

  constructor(uploadConfig: Required<UploadConfig>, routingConfig?: FileRoutingConfig) {
    this.uploadConfig = uploadConfig
    this.config = routingConfig || this.getDefaultRoutingConfig()
  }

  private getDefaultRoutingConfig(): FileRoutingConfig {
    return {
      routes: {
        images: {
          directory: this.uploadConfig.uploadDir,
          allowedTypes: this.uploadConfig.allowedImageTypes,
          maxSize: this.uploadConfig.maxFileSize,
        },
        documents: {
          directory: this.uploadConfig.docsDir,
          allowedTypes: this.uploadConfig.allowedDocTypes,
          maxSize: this.uploadConfig.maxFileSize,
        },
        avatars: {
          directory: this.uploadConfig.uploadDir,
          subdirectory: "avatars",
          allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          maxSize: 2, // 2MB for avatars
        },
        thumbnails: {
          directory: this.uploadConfig.uploadDir,
          subdirectory: "thumbnails",
          allowedTypes: ["image/jpeg", "image/png", "image/webp"],
          maxSize: 1, // 1MB for thumbnails
        },
      },
      defaultRoute: "images",
      createSubdirectories: true,
    }
  }

  determineRoute(file: File, routeHint?: string): FileRoute | null {
    const mimeType = file.type

    // If route hint is provided and valid, use it
    if (routeHint && this.config.routes[routeHint]) {
      const route = this.config.routes[routeHint]
      if (route.allowedTypes.includes(mimeType)) {
        return route
      }
    }

    // Auto-determine route based on file type
    if (isImageFile(mimeType)) {
      return this.config.routes.images || this.config.routes[this.config.defaultRoute || "images"]
    }

    if (isDocumentFile(mimeType)) {
      return this.config.routes.documents || this.config.routes[this.config.defaultRoute || "documents"]
    }

    // Fallback to default route
    if (this.config.defaultRoute && this.config.routes[this.config.defaultRoute]) {
      return this.config.routes[this.config.defaultRoute]
    }

    return null
  }

  getUploadPath(route: FileRoute, filename: string): string {
    const basePath = path.join(process.cwd(), "public", route.directory)

    if (route.subdirectory) {
      return path.join(basePath, route.subdirectory, filename)
    }

    return path.join(basePath, filename)
  }

  getPublicUrl(route: FileRoute, filename: string): string {
    let url = `/${route.directory}`

    if (route.subdirectory) {
      url += `/${route.subdirectory}`
    }

    return `${url}/${filename}`
  }

  validateFileForRoute(file: File, route: FileRoute): { valid: boolean; error?: string } {
    // Check file type
    if (!route.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed for this route`,
      }
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    const maxSize = route.maxSize || this.uploadConfig.maxFileSize

    if (fileSizeInMB > maxSize) {
      return {
        valid: false,
        error: `File size ${fileSizeInMB.toFixed(2)}MB exceeds maximum of ${maxSize}MB for this route`,
      }
    }

    return { valid: true }
  }

  // Get all available routes
  getAvailableRoutes(): string[] {
    return Object.keys(this.config.routes)
  }

  // Get route configuration
  getRouteConfig(routeName: string): FileRoute | undefined {
    return this.config.routes[routeName]
  }

  // Add custom route
  addRoute(name: string, route: FileRoute): void {
    this.config.routes[name] = route
  }

  // Remove route
  removeRoute(name: string): void {
    delete this.config.routes[name]
  }
}
