const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const env = require('../config/env');

// Where the 'local' driver writes. This is the same directory app.ts serves at
// /uploads, so a saved file is immediately reachable at its returned URL.
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// All images are normalised to WebP before storage, whichever driver is used.
const toWebp = (buffer, width, height) =>
  sharp(buffer).resize(width, height, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();

// ── Local disk driver (no third-party account; good for self-hosting) ──
const uploadLocal = async (buffer, folder) => {
  const dir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.webp`;
  fs.writeFileSync(path.join(dir, name), buffer);
  return `/uploads/${folder}/${name}`; // served statically by app.ts
};

const deleteLocal = (url) => {
  try {
    const rel = url.replace(/^\/uploads\//, '');
    const abs = path.join(UPLOADS_ROOT, rel);
    // Stay inside the uploads root — never follow a crafted ../ path.
    if (abs.startsWith(UPLOADS_ROOT) && fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (error) {
    console.error('Failed to delete local image:', error.message);
  }
};

// ── Cloudinary driver (default; CDN delivery in production) ──
const uploadCloudinary = async (buffer, folder) => {
  const cloudinary = require('../config/cloudinary');
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `rnsp/${folder}`, resource_type: 'image' }, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      })
      .end(buffer);
  });
};

const deleteCloudinary = async (url) => {
  try {
    const cloudinary = require('../config/cloudinary');
    // https://res.cloudinary.com/<cloud>/image/upload/v<ver>/rnsp/<folder>/<id>.webp
    const parts = url.split('/');
    const publicId = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`rnsp/${folder}/${publicId}`);
  } catch (error) {
    console.error('Failed to delete image:', error.message);
  }
};

/**
 * Keep a record of an uploaded file.
 *
 * A URL stored in a VarChar on the thing it belongs to cannot be listed,
 * attributed, or found again once the row that referenced it changes — so the
 * media library had to be assembled by scanning four tables for non-null image
 * columns, and a file nothing pointed at was invisible. This row is what makes
 * an upload findable afterwards.
 *
 * Best-effort by design: the file is already stored, and failing to write the
 * bookkeeping must not fail the upload that succeeded.
 */
const recordMedia = async (url, file, folder, meta: any = {}) => {
  try {
    const prisma = require('../config/db');
    await prisma.media.create({
      data: {
        url,
        mimeType: file?.mimetype || 'image/webp',
        bytes: file?.size ?? 0,
        ownerType: meta.ownerType || folder,
        ownerId: meta.ownerId ?? null,
        purpose: meta.purpose || null,
        uploadedById: meta.uploadedById ?? null,
      },
    });
  } catch (error) {
    console.log(`Media record skipped for ${url}: ${error.message}`);
  }
};

const uploadImage = async (file, folder, width = 400, height = 400, meta: any = {}) => {
  try {
    const buffer = await toWebp(file.buffer, width, height);
    const url = env.STORAGE_DRIVER === 'local'
      ? await uploadLocal(buffer, folder)
      : await uploadCloudinary(buffer, folder);

    await recordMedia(url, file, folder, meta);
    return url;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteImage = async (url) => {
  if (!url) return;
  // Route by URL shape so a driver switch doesn't orphan previously-stored files.
  if (url.startsWith('/uploads/')) return deleteLocal(url);
  return deleteCloudinary(url);
};

module.exports = { uploadImage, recordMedia, deleteImage };
