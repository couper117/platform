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
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp|mp4|mov|webm|pdf/;
  const ext = allowed.test(path.extname(file.originalname).slice(1).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext || mime) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = (subdir = 'logos') => multer({
  storage: storage(subdir),
  limits: { fileSize: maxSize },
  fileFilter
});

module.exports = upload;