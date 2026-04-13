const { prisma } = require("../../lib/prisma");

async function listDocumentsByUser(userId) {
  return prisma.document.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      isPublic: true,
    },
  });
}

async function createDocument(data) {
  return prisma.document.create({
    data,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      isPublic: true,
    },
  });
}

async function findDocumentById(id) {
  return prisma.document.findUnique({
    where: {
      id,
    },
  });
}

async function updateDocumentById(id, data) {
  return prisma.document.update({
    where: {
      id,
    },
    data,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      isPublic: true,
    },
  });
}

async function deleteDocumentById(id) {
  return prisma.document.delete({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });
}

module.exports = {
  listDocumentsByUser,
  createDocument,
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
};
