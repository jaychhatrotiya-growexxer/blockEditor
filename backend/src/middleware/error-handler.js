const { HTTP_STATUS } = require("../utils/http-status");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const shouldExpose = err.expose ?? statusCode < 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: shouldExpose ? err.message : "Something went wrong.",
      details: shouldExpose ? err.details || null : null,
    },
  });
}

module.exports = {
  errorHandler,
};
