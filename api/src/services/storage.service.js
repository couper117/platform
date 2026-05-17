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