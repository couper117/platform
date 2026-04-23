const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry', field: err.sqlMessage });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message
  });
};

module.exports = errorHandler;