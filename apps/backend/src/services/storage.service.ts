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

const uploadImage = async (file, folder, width = 400, height = 400) => {
  try {
    const buffer = await toWebp(file.buffer, width, height);
    return env.STORAGE_DRIVER === 'local'
      ? uploadLocal(buffer, folder)
      : uploadCloudinary(buffer, folder);
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

module.exports = { uploadImage, deleteImage };
