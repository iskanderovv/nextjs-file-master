export interface UploadConfig {
  maxFileSize?: number // in MB, default 5MB
  allowedImageTypes?: string[]
  allowedDocTypes?: string[]
  convertToWebP?: boolean
  quality?: number // WebP quality 1-100
  uploadDir?: string
  docsDir?: string
  generateThumbnails?: boolean
  thumbnailSize?: number
  generateResponsive?: boolean
  responsiveSizes?: number[]
}

export interface UploadedFile {
  filename: string
  originalName: string
  size: number
  type: string
  path: string
  url: string
  isImage: boolean
  metadata?: {
    width?: number
    height?: number
    format?: string
    hasAlpha?: boolean
  }
  thumbnail?: {
    path: string
    url: string
  }
  responsive?: Array<{
    size: number
    path: string
    url: string
  }>
}

export interface UploadResult {
  success: boolean
  files?: UploadedFile | UploadedFile[]
  error?: string
}
