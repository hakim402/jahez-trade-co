// app/[locale]/admin/files/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// ----------------------------------------------------------------------
// Validation schemas
// ----------------------------------------------------------------------
const getFilesSchema = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  requestId: z.string().optional(),
  fileType: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['uploadedAt', 'fileName', 'fileSize']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetFilesParams = z.infer<typeof getFilesSchema>;

export type GetFilesReturn = {
  files: Array<{
    id: string;
    url: string;
    fileType: string;
    fileName: string | null;
    fileSize: number | null;
    uploadedAt: Date;
    request: {
      id: string;
      productLink: string | null;
      user: {
        email: string;
      };
    };
  }>;
  nextCursor: string | null;
  total: number;
};

// ----------------------------------------------------------------------
// List files (admin only)
// ----------------------------------------------------------------------
export async function getFiles(rawParams: GetFilesParams): Promise<GetFilesReturn> {
  await requireAdmin();

  const params = getFilesSchema.parse(rawParams);
  const { take, cursor, requestId, fileType, search, sortBy, sortOrder } = params;

  const where: Prisma.FileUploadWhereInput = {};
  if (requestId) where.requestId = requestId;
  if (fileType) where.fileType = fileType;
  if (search) {
    where.OR = [
      { fileName: { contains: search, mode: 'insensitive' } },
      { request: { productLink: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const total = await prisma.fileUpload.count({ where });

  const orderBy: Prisma.FileUploadOrderByWithRelationInput = { [sortBy]: sortOrder };

  const files = await prisma.fileUpload.findMany({
    take: take + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy,
    select: {
      id: true,
      url: true,
      fileType: true,
      fileName: true,
      fileSize: true,
      uploadedAt: true,
      request: {
        select: {
          id: true,
          productLink: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (files.length > take) {
    const nextItem = files.pop();
    nextCursor = nextItem!.id;
  }

  return {
    files: files as GetFilesReturn['files'],
    nextCursor,
    total,
  };
}

// ----------------------------------------------------------------------
// Get single file by ID
// ----------------------------------------------------------------------
const getFileByIdSchema = z.object({ id: z.string() });

export type GetFileByIdReturn = {
  file: {
    id: string;
    url: string;
    fileType: string;
    fileName: string | null;
    fileSize: number | null;
    uploadedAt: Date;
    aiTags: Prisma.JsonValue;
    request: {
      id: string;
      productLink: string | null;
      description: string | null;
      quantity: number;
      user: {
        fullName: string | null;
        email: string;
      };
    };
  };
};

export async function getFileById(rawParams: { id: string }): Promise<GetFileByIdReturn> {
  await requireAdmin();
  const { id } = getFileByIdSchema.parse(rawParams);

  const file = await prisma.fileUpload.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
      fileType: true,
      fileName: true,
      fileSize: true,
      uploadedAt: true,
      aiTags: true,
      request: {
        select: {
          id: true,
          productLink: true,
          description: true,
          quantity: true,
          user: { select: { fullName: true, email: true } },
        },
      },
    },
  });

  if (!file) throw new Error('File not found');
  return { file };
}

// ----------------------------------------------------------------------
// Local file storage helpers
// ----------------------------------------------------------------------
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw new Error('Could not initialize file storage');
  }
}

// Generate a unique filename to avoid collisions
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const sanitized = base.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const uniqueId = randomUUID();
  return `${sanitized}_${uniqueId}${ext}`;
}

// ----------------------------------------------------------------------
// Upload a file (server action) – local storage
// ----------------------------------------------------------------------
const uploadFileSchema = z.object({
  requestId: z.string(),
});

export async function uploadFile(formData: FormData) {
  await requireAdmin();

  // Validate form data
  const requestId = formData.get('requestId') as string;
  const file = formData.get('file') as File;

  if (!requestId) throw new Error('requestId is required');
  if (!file) throw new Error('File is required');
  if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB'); // 10MB limit

  // Optional: validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.');
  }

  // Ensure upload directory exists
  await ensureUploadDir();

  // Convert file to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.name);
  const filePath = path.join(UPLOAD_DIR, uniqueFilename);

  // Write file to disk
  try {
    await writeFile(filePath, buffer);
  } catch (error) {
    console.error('Failed to write file:', error);
    throw new Error('Failed to save file');
  }

  // Generate URL that will be served by an API route (to be implemented)
  // Example: /api/files/[filename]
  const fileUrl = `/api/files/${uniqueFilename}`;

  // Create database record
  const fileRecord = await prisma.fileUpload.create({
    data: {
      url: fileUrl,
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
      requestId,
      // aiTags left empty for now
    },
  });

  await logAdminAction({
    action: 'UPLOAD_FILE',
    entity: 'FileUpload',
    entityId: fileRecord.id,
    changes: { after: { url: fileUrl, fileName: file.name } },
  });

  revalidatePath(`/admin/product-requests/${requestId}`);
  revalidatePath('/admin/files');

  return { success: true, fileId: fileRecord.id };
}

// ----------------------------------------------------------------------
// Delete a file (from database and disk)
// ----------------------------------------------------------------------
const deleteFileSchema = z.object({ fileId: z.string() });

export async function deleteFile(input: { fileId: string }) {
  await requireAdmin();
  const { fileId } = deleteFileSchema.parse(input);

  // Fetch the file record to get the URL/path
  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: { requestId: true, url: true },
  });
  if (!file) throw new Error('File not found');

  // Extract filename from URL (assuming URL is /api/files/[filename])
  const filename = file.url.split('/').pop();
  if (!filename) throw new Error('Invalid file URL');

  const filePath = path.join(UPLOAD_DIR, filename);

  // Delete from database first (so if disk delete fails, we don't have orphaned DB records)
  await prisma.fileUpload.delete({ where: { id: fileId } });

  // Attempt to delete from disk
  try {
    await unlink(filePath);
  } catch (error) {
    // Log but don't fail – file might already be missing
    console.error('Failed to delete physical file:', error);
  }

  await logAdminAction({
    action: 'DELETE_FILE',
    entity: 'FileUpload',
    entityId: fileId,
    changes: { deleted: true },
  });

  revalidatePath(`/admin/product-requests/${file.requestId}`);
  revalidatePath('/admin/files');

  return { success: true };
}