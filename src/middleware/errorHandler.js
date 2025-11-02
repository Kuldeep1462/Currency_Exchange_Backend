function errorHandler(err, req, res, next) {
  console.error(err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
