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

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack || err.message);

  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  const prismaMapped = err.code && err.code.startsWith('P') ? mapPrisma(err) : null;
  if (prismaMapped) {
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
