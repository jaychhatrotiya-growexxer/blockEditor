const { ZodError } = require("zod");
const { AppError } = require("../utils/app-error");
const { HTTP_STATUS } = require("../utils/http-status");

function validate(schema) {
  return (req, res, next) => {
    try {
      let body = req.body ?? {};

      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (parseError) {
          body = {};
        }
      }

      const result = schema.parse({
        body,
        params: req.params ?? {},
        query: req.query ?? {},
        cookies: req.cookies ?? {},
        headers: req.headers ?? {},
      });

      req.validated = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError("Validation failed.", HTTP_STATUS.UNPROCESSABLE_ENTITY, {
            code: "VALIDATION_ERROR",
            details: error.flatten(),
          }),
        );
      }

      next(error);
    }
  };
}

module.exports = {
  validate,
};
