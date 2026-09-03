const env = require('../config/env');

// Map common Prisma error codes to sensible HTTP statuses + clean messages
// instead of leaking internals as generic 500s.
const mapPrisma = (err) => {
  switch (err.code) {
    case 'P2002':
      return { status: 409, message: `A record with this ${(err.meta?.target || ['value'])} already exists.` };
    case 'P2025':
      return { status: 404, message: 'Record not found.' };
    case 'P2003':
      return { status: 400, message: 'Related record does not exist.' };
    case 'P2000':
      return { status: 400, message: 'Input value is too long for one of the fields.' };
    default:
      return null;
  }
};

// Multer rejects a bad upload by throwing, and its errors carry a `code` but no
// `statusCode` — so an oversized file surfaced as a 500, which in production the
// branch below then rewrote to "Internal Server Error". A phone photograph is
// routinely larger than the 8MB limit, so this is the single most likely upload
// failure in the product, and it was being reported as a server fault.
const mapMulter = (err) => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return { status: 413, message: 'That file is too large. The limit is 8MB.' };
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return { status: 400, message: 'Unexpected file upload.' };
    case 'LIMIT_PART_COUNT':
    case 'LIMIT_FIELD_COUNT':
    case 'LIMIT_FIELD_KEY':
    case 'LIMIT_FIELD_VALUE':
      return { status: 400, message: 'That upload could not be read.' };
    default:
      return null;
  }
};

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack || err.message);

  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  const prismaMapped = err.code && err.code.startsWith('P') ? mapPrisma(err) : null;
  const multerMapped = prismaMapped ? null : mapMulter(err);
  if (multerMapped) {
    status = multerMapped.status;
    message = multerMapped.message;
  } else if (prismaMapped) {
    status = prismaMapped.status;
    message = prismaMapped.message;
  } else if (status === 500 && env.NODE_ENV === 'production') {
    // Don't leak internal error details in production.
    message = 'Internal Server Error';
  }

  res.status(status).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
