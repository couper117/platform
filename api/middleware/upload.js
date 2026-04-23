const multer = require('multer');
const path = require('path');
const fs = require('fs');

const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE) || 8388608;

const storage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = 'rnsp_' + Date.now() + '_' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }