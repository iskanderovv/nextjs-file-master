# nextjs-file-master

A powerful and flexible file upload handler for Next.js applications with automatic image optimization, WebP conversion, and intelligent file routing.

## Features

- 🚀 **Easy Integration** - Simple setup with Next.js App Router
- 🖼️ **Automatic Image Optimization** - Convert images to WebP format with configurable quality
- 📁 **Smart File Routing** - Automatically route images and documents to appropriate directories
- 🔧 **Highly Configurable** - Customize file size limits, allowed types, and processing options
- 📱 **Responsive Images** - Generate multiple sizes for responsive web design
- 🖼️ **Thumbnail Generation** - Automatic thumbnail creation for images
- 🔒 **Type Safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Performance Optimized** - Efficient file processing with Sharp.js

## Installation

\`\`\`bash
npm install nextjs-file-master
# or
yarn add nextjs-file-master
# or
pnpm add nextjs-file-master
\`\`\`

## Quick Start

### 1. Create API Route

Create `app/api/uploads/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { FileUploadHandler } from 'nextjs-file-master';

export async function POST(request: NextRequest) {
  try {
    const result = await FileUploadHandler.upload(request, {
      maxFileSize: 5, // 5MB
      convertToWebP: true,
      quality: 80
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      files: result.files
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
\`\`\`

### 2. Create Upload Form

\`\`\`typescript
'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Upload result:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={(e) => setFiles(e.target.files)}
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
    </form>
  );
}
\`\`\`

## Configuration Options

### UploadConfig

\`\`\`typescript
interface UploadConfig {
  maxFileSize?: number;           // Maximum file size in MB (default: 5)
  allowedImageTypes?: string[];   // Allowed image MIME types
  allowedDocTypes?: string[];     // Allowed document MIME types
  convertToWebP?: boolean;        // Convert images to WebP (default: true)
  quality?: number;               // WebP quality 1-100 (default: 80)
  uploadDir?: string;             // Directory for images (default: 'uploads')
  docsDir?: string;               // Directory for documents (default: 'docs')
  generateThumbnails?: boolean;   // Generate thumbnails (default: false)
  thumbnailSize?: number;         // Thumbnail size in pixels (default: 200)
  generateResponsive?: boolean;   // Generate responsive images (default: false)
  responsiveSizes?: number[];     // Responsive image sizes (default: [400, 800, 1200])
}
\`\`\`

### Default Configuration

\`\`\`typescript
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
\`\`\`

## Advanced Usage

### Custom File Routing

\`\`\`typescript
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
        maxSize: 2 // 2MB for avatars
      },
      products: {
        directory: 'uploads',
        subdirectory: 'products',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 5 // 5MB for product images
      },
      documents: {
        directory: 'docs',
        allowedTypes: ['application/pdf'],
        maxSize: 10 // 10MB for documents
      }
    },
    defaultRoute: 'products'
  }
);

// Upload with specific route
const result = await handler.handleUpload(request, 'avatars');
\`\`\`

### With Thumbnails and Responsive Images

\`\`\`typescript
const result = await FileUploadHandler.upload(request, {
  maxFileSize: 10,
  convertToWebP: true,
  quality: 85,
  generateThumbnails: true,
  thumbnailSize: 300,
  generateResponsive: true,
  responsiveSizes: [400, 800, 1200, 1600]
});

// Result includes thumbnail and responsive image URLs
console.log(result.files.thumbnail?.url);
console.log(result.files.responsive); // Array of different sizes
\`\`\`

### File Type Validation

The package automatically validates file types and routes them appropriately:

- **Images** → `/uploads` directory (converted to WebP if enabled)
- **Documents** → `/docs` directory (preserved in original format)

### Response Format

#### Single File Upload

\`\`\`typescript
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
    metadata: {
      width: 1920,
      height: 1080,
      format: "webp",
      hasAlpha: false
    },
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
\`\`\`

#### Multiple Files Upload

\`\`\`typescript
{
  success: true,
  files: [
    { /* file 1 */ },
    { /* file 2 */ }
  ]
}
\`\`\`

#### Error Response

\`\`\`typescript
{
  success: false,
  error: "File size exceeds maximum limit"
}
\`\`\`

## Directory Structure

After installation, your `public` directory will look like:

\`\`\`
public/
├── uploads/           # Images (converted to WebP)
│   ├── avatars/      # Custom route example
│   ├── products/     # Custom route example
│   └── thumbnails/   # Generated thumbnails
└── docs/             # Documents (original format)
\`\`\`

## Error Handling

The package provides detailed error messages for common issues:

- File size exceeds limit
- Invalid file type
- Upload directory creation failed
- Image processing errors

\`\`\`typescript
const result = await FileUploadHandler.upload(request, config);

if (!result.success) {
  console.error('Upload failed:', result.error);
  // Handle error appropriately
}
\`\`\`

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

\`\`\`typescript
import type { 
  UploadConfig, 
  UploadedFile, 
  UploadResult 
} from 'nextjs-file-master';
\`\`\`

## Requirements

- Next.js 13+ (App Router)
- Node.js 16+
- Sharp.js (automatically installed)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
