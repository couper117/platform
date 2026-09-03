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

/**
 * A DOCUMENT IS NOT AN AVATAR, and resizing one like an avatar destroys it.
 *
 * `fit: 'cover'` fills the box and crops whatever does not fit — correct for a
 * crest or a face, catastrophic for a birth certificate: a photograph of an A4
 * page became an 800x800 square with the top and bottom cut off, taking the
 * header, the stamp and the signature with them. The reviewer then rejected it as
 * unreadable and the club uploaded the same page again.
 *
 * `fit: 'inside'` scales the whole page down to fit the bound and crops nothing,
 * `withoutEnlargement` leaves a small scan alone rather than blowing it up into
 * mush, and the bound is 1600 because a document has to be READ, not recognised.
 */
const documentToWebp = (buffer) =>
  sharp(buffer)
    .rotate() // honour the EXIF orientation a phone camera writes
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

// ── Local disk driver (no third-party account; good for self-hosting) ──
const uploadLocal = async (buffer, folder, ext = 'webp') => {
  const dir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
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
const uploadCloudinary = async (buffer, folder, resourceType = 'image') => {
  const cloudinary = require('../config/cloudinary');
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `rnsp/${folder}`, resource_type: resourceType }, (error, result) => {
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

/**
 * A player's identity document: a photograph of a page, or a PDF of one.
 *
 * PDFs WERE ACCEPTED AND THEN CRASHED. `middleware/upload.ts` has always let
 * `application/pdf` through — a scanned certificate is a PDF more often than not
 * — and every upload then went through sharp, which answers a PDF with "Input
 * buffer contains unsupported image format". That surfaced as a 500, so the one
 * file format an official document usually arrives in was invited in and then
 * refused by a server error.
 *
 * So a PDF is stored as it came: no resize, no re-encode, nothing sharp can fail
 * on. An image still gets normalised, but with `documentToWebp` above, which
 * fits the page instead of cropping it.
 */
const uploadDocumentFile = async (file, folder = 'documents', meta: any = {}) => {
  try {
    const isPdf = String(file?.mimetype || '') === 'application/pdf';
    const buffer = isPdf ? file.buffer : await documentToWebp(file.buffer);
    const url = env.STORAGE_DRIVER === 'local'
      ? await uploadLocal(buffer, folder, isPdf ? 'pdf' : 'webp')
      // `raw` keeps the PDF a PDF. Cloudinary's `image` pipeline would try to
      // rasterise it, which is a different file from the one the club sent.
      : await uploadCloudinary(buffer, folder, isPdf ? 'raw' : 'image');

    await recordMedia(url, file, folder, meta);
    return url;
  } catch (error) {
    throw new Error(`Failed to store document: ${error.message}`);
  }
};

const deleteImage = async (url) => {
  if (!url) return;
  // Route by URL shape so a driver switch doesn't orphan previously-stored files.
  if (url.startsWith('/uploads/')) return deleteLocal(url);
  return deleteCloudinary(url);
};

module.exports = { uploadImage, uploadDocumentFile, recordMedia, deleteImage };
