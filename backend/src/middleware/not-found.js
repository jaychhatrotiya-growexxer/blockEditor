const { AppError } = require("../utils/app-error");
const { HTTP_STATUS } = require("../utils/http-status");

function notFoundHandler(req, res, next) {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND, {
      code: "ROUTE_NOT_FOUND",
    }),
  );
}

module.exports = {
  notFoundHandler,
};
