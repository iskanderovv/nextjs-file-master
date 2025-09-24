# nextjs-file-master

A powerful and flexible file upload handler for Next.js applications with automatic image optimization, WebP conversion, and intelligent file routing.

## Features

- 🚀 Easy Integration — Simple setup with Next.js App Router
- 🖼️ Automatic Image Optimization — Convert images to WebP with configurable quality
- 📁 Smart File Routing — Automatically route images and documents to appropriate directories
- 🔧 Highly Configurable — Customize size limits, allowed types, and processing options
- 📱 Responsive Images — Generate multiple sizes for responsive web design
- 🖼️ Thumbnail Generation — Automatic thumbnails
- 🔒 Type Safe — Full TypeScript support
- ⚡ Performance Optimized — Efficient file processing with Sharp.js

## Installation

```bash
npm install nextjs-file-master
# or
yarn add nextjs-file-master
# or
pnpm add nextjs-file-master
```

## Quick Start

### 1) API Route (App Router)

Create `app/api/uploads/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FileUploadHandler } from 'nextjs-file-master';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const result = await FileUploadHandler.upload(request, {
      maxFileSize: 5,         // MB
      convertToWebP: true,
      quality: 80
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, files: result.files });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

## Configuration

### UploadConfig

```typescript
interface UploadConfig {
  maxFileSize?: number;           // MB (default: 5)
  allowedImageTypes?: string[];   // Allowed image MIME types
  allowedDocTypes?: string[];     // Allowed document MIME types
  convertToWebP?: boolean;        // Convert images to WebP (default: true)
  quality?: number;               // WebP quality 1-100 (default: 80)
  uploadDir?: string;             // Images dir (default: 'uploads')
  docsDir?: string;               // Docs dir (default: 'docs')
  generateThumbnails?: boolean;   // Thumbnails (default: false)
  thumbnailSize?: number;         // px (default: 200)
  generateResponsive?: boolean;   // Responsive images (default: false)
  responsiveSizes?: number[];     // (default: [400, 800, 1200])
}
```

### Defaults

```typescript
const DEFAULT_CONFIG = {
  maxFileSize: 5,
  allowedImageTypes: [
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif', 'image/webp', 'image/bmp', 'image/tiff'
  ],
  allowedDocTypes: [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ],
  convertToWebP: true,
  quality: 80,
  uploadDir: 'uploads',
  docsDir: 'docs',
  generateThumbnails: false,
  thumbnailSize: 200,
  generateResponsive: false,
  responsiveSizes: [400, 800, 1200]
};
```

## Advanced

### Custom File Routing

```typescript
import { FileUploadHandler } from 'nextjs-file-master';

const handler = new FileUploadHandler(
  {
    maxFileSize: 8,
    convertToWebP: true,
    quality: 85
  },
  {
    routes: {
      avatars: {
        directory: 'uploads',
        subdirectory: 'avatars',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 2
      },
      products: {
        directory: 'uploads',
        subdirectory: 'products',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 5
      },
      documents: {
        directory: 'docs',
        allowedTypes: ['application/pdf'],
        maxSize: 10
      }
    },
    defaultRoute: 'products'
  }
);

// Upload with a specific route
const result = await handler.handleUpload(request, 'avatars');
```

### Thumbnails and Responsive Images

```typescript
const result = await FileUploadHandler.upload(request, {
  maxFileSize: 10,
  convertToWebP: true,
  quality: 85,
  generateThumbnails: true,
  thumbnailSize: 300,
  generateResponsive: true,
  responsiveSizes: [400, 800, 1200, 1600]
});

console.log(result.files.thumbnail?.url);
console.log(result.files.responsive); // Array of different sizes
```

## Validation and Routing

- Images → `public/uploads` (converted to WebP if enabled)
- Documents → `public/docs` (original format)

## Response Format

### Single File

```typescript
{
  success: true,
  files: {
    filename: "image_1640995200000_abc123.webp",
    originalName: "photo.jpg",
    size: 1024000,
    type: "image/webp",
    path: "/path/to/public/uploads/image_1640995200000_abc123.webp",
    url: "/uploads/image_1640995200000_abc123.webp",
    isImage: true,
    metadata: { width: 1920, height: 1080, format: "webp", hasAlpha: false },
    thumbnail?: {
      path: "/path/to/thumbnail.webp",
      url: "/uploads/thumbnails/image_1640995200000_abc123_thumb.webp"
    },
    responsive?: [
      { size: 400, path: "...", url: "/uploads/image_400w.webp" },
      { size: 800, path: "...", url: "/uploads/image_800w.webp" }
    ]
  }
}
```

### Multiple Files

```typescript
{
  success: true,
  files: [
    { /* file 1 */ },
    { /* file 2 */ }
  ]
}
```

### Error

```typescript
{
  success: false,
  error: "File size exceeds maximum limit"
}
```

## Directory Structure

```
public/
├─ uploads/           # Images (WebP)
│  ├─ avatars/        # Custom route
│  ├─ products/       # Custom route
│  └─ thumbnails/     # Generated
└─ docs/              # Documents
```

## Error Handling

```typescript
const result = await FileUploadHandler.upload(request, config);

if (!result.success) {
  console.error('Upload failed:', result.error);
  // Handle error
}
```

## TypeScript

```typescript
import type { UploadConfig, UploadedFile, UploadResult } from 'nextjs-file-master';
```

## Requirements

- Next.js 13+ (App Router)
- Node.js 16+
- Sharp.js (installed automatically)

## Contributing

PRs are welcome!

## License

MIT — see LICENSE.

## Support

Open an issue on GitHub if you have questions or problems.
