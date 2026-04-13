const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { AppError } = require("../utils/app-error");
const { HTTP_STATUS } = require("../utils/http-status");

function extractBearerToken(authorizationHeader = "") {
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function authenticateAccessToken(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(
      new AppError("Authentication required.", HTTP_STATUS.UNAUTHORIZED, {
        code: "AUTH_REQUIRED",
      }),
    );
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (payload.type !== "access" || !payload.sub) {
      throw new AppError("Invalid access token.", HTTP_STATUS.UNAUTHORIZED, {
        code: "INVALID_ACCESS_TOKEN",
      });
    }

    req.auth = {
      userId: payload.sub,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(
      new AppError("Invalid or expired access token.", HTTP_STATUS.UNAUTHORIZED, {
        code: "INVALID_ACCESS_TOKEN",
      }),
    );
  }
}

module.exports = {
  authenticateAccessToken,
};
