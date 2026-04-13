const { prisma } = require("../../lib/prisma");

async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
}

async function createUser(data) {
  return prisma.user.create({
    data,
  });
}

async function createRefreshSession(data) {
  return prisma.refreshSession.create({
    data,
  });
}

async function findRefreshSessionById(id) {
  return prisma.refreshSession.findUnique({
    where: {
      id,
    },
  });
}

async function revokeRefreshSession(id) {
  return prisma.refreshSession.update({
    where: {
      id,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  createRefreshSession,
  findRefreshSessionById,
  revokeRefreshSession,
};
