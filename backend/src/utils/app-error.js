class AppError extends Error {
  constructor(message, statusCode, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code || "APP_ERROR";
    this.details = options.details || null;
    this.expose = options.expose ?? statusCode < 500;
  }
}

module.exports = {
  AppError,
};
