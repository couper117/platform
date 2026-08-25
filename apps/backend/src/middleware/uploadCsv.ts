const multer = require('multer');

// Separate from middleware/upload.ts, which only admits images and PDFs.
//
// The filename extension is the gate, not the MIME type: spreadsheet exports
// arrive as text/csv, text/plain, application/vnd.ms-excel or
// application/octet-stream depending on the browser and OS, so trusting the MIME
// type would either reject real CSVs or wave through any text file.
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB — comfortably above a 5,000-row roster
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (/\.csv$/i.test(file.originalname)) return cb(null, true);
    return cb(new Error('Only .csv files are accepted — export your spreadsheet as CSV first.'), false);
  },
});

module.exports = uploadCsv;
