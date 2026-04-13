const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Prisma } = require("@prisma/client");
const {
  createRefreshSession,
  createUser,
  findRefreshSessionById,
  findUserByEmail,
  findUserById,
  revokeRefreshSession,
} = require("./repository");
const { env } = require("../../config/env");
const { AppError } = require("../../utils/app-error");
const { HTTP_STATUS } = require("../../utils/http-status");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function signAccessToken(userId) {
  return jwt.sign({ type: "access" }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });
}

function signRefreshToken(userId, sessionId) {
  return jwt.sign({ type: "refresh", sid: sessionId }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (payload.type !== "refresh" || !payload.sub || !payload.sid) {
      throw new Error("Malformed refresh token.");
    }

    return payload;
  } catch (error) {
    throw new AppError("Invalid or expired refresh token.", HTTP_STATUS.UNAUTHORIZED, {
      code: "INVALID_REFRESH_TOKEN",
    });
  }
}

async function issueTokensForUser(userId) {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken(userId, sessionId);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshPayload = jwt.decode(refreshToken);

  await createRefreshSession({
    id: sessionId,
    userId,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(refreshPayload.exp * 1000),
  });

  return {
    accessToken: signAccessToken(userId),
    refreshToken,
  };
}

async function register(input) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError("Email is already registered.", HTTP_STATUS.CONFLICT, {
      code: "EMAIL_ALREADY_REGISTERED",
    });
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
  let user;

  try {
    user = await createUser({
      email: input.email,
      passwordHash,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Email is already registered.", HTTP_STATUS.CONFLICT, {
        code: "EMAIL_ALREADY_REGISTERED",
      });
    }

    throw error;
  }

  const tokens = await issueTokensForUser(user.id);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
}

async function login(input) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED, {
      code: "INVALID_CREDENTIALS",
    });
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED, {
      code: "INVALID_CREDENTIALS",
    });
  }

  const tokens = await issueTokensForUser(user.id);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
}

async function refreshSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const session = await findRefreshSessionById(payload.sid);

  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError("Refresh session is no longer valid.", HTTP_STATUS.UNAUTHORIZED, {
      code: "REFRESH_SESSION_INVALID",
    });
  }

  const presentedTokenHash = hashToken(refreshToken);

  if (session.tokenHash !== presentedTokenHash) {
    throw new AppError("Refresh token mismatch.", HTTP_STATUS.UNAUTHORIZED, {
      code: "REFRESH_TOKEN_MISMATCH",
    });
  }

  await revokeRefreshSession(session.id);

  const user = await findUserById(payload.sub);

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.UNAUTHORIZED, {
      code: "USER_NOT_FOUND",
    });
  }

  const nextTokens = await issueTokensForUser(user.id);

  return {
    user: buildSafeUser(user),
    ...nextTokens,
  };
}

async function logout(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const session = await findRefreshSessionById(payload.sid);

    if (session && !session.revokedAt) {
      const presentedTokenHash = hashToken(refreshToken);

      if (session.tokenHash === presentedTokenHash) {
        await revokeRefreshSession(session.id);
      }
    }
  } catch (error) {
    return;
  }
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.UNAUTHORIZED, {
      code: "USER_NOT_FOUND",
    });
  }

  return buildSafeUser(user);
}

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  getCurrentUser,
};
