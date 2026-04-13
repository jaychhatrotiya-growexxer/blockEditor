const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");
const { HTTP_STATUS } = require("../../utils/http-status");
const { getCurrentUser, login, logout, refreshSession, register } = require("./service");

function getRefreshCookieOptions(refreshToken) {
  const decoded = refreshToken ? jwt.decode(refreshToken) : null;
  const maxAge = decoded?.exp ? Math.max(decoded.exp * 1000 - Date.now(), 0) : undefined;

  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge,
  };
}

function clearRefreshCookie(res) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(refreshToken));
}

function getRefreshTokenFromCookie(req) {
  const refreshToken = req.cookies[env.REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new AppError("Refresh token is required.", HTTP_STATUS.UNAUTHORIZED, {
      code: "REFRESH_TOKEN_REQUIRED",
    });
  }

  return refreshToken;
}

async function registerController(req, res) {
  const result = await register(req.validated.body);

  setRefreshCookie(res, result.refreshToken);

  res.status(HTTP_STATUS.CREATED).json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

async function loginController(req, res) {
  const result = await login(req.validated.body);

  setRefreshCookie(res, result.refreshToken);

  res.status(HTTP_STATUS.OK).json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

async function refreshController(req, res) {
  const refreshToken = getRefreshTokenFromCookie(req);
  const result = await refreshSession(refreshToken);

  setRefreshCookie(res, result.refreshToken);

  res.status(HTTP_STATUS.OK).json({
    user: result.user,
    accessToken: result.accessToken,
  });
}

async function logoutController(req, res) {
  const refreshToken = req.cookies[env.REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await logout(refreshToken);
  }

  clearRefreshCookie(res);

  res.status(HTTP_STATUS.NO_CONTENT).send();
}

async function meController(req, res) {
  const user = await getCurrentUser(req.auth.userId);

  res.status(HTTP_STATUS.OK).json({
    user,
  });
}

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
  meController,
};
