const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

const uploadImage = async (file, folder, width = 400, height = 400) => {
  try {
    // Resize and compress with sharp
    const buffer = await sharp(file.buffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: `rnsp/${folder}`, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      ).end(buffer);
    });
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteImage = async (url) => {
  if (!url) return;
  try {
    // Extract public_id from url
    // Cloudinary URLs look like: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/rnsp/[folder]/[public_id].webp
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts[parts.length - 2];
    
    await cloudinary.uploader.destroy(`rnsp/${folder}/${publicId}`);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
};

module.exports = { uploadImage, deleteImage };
