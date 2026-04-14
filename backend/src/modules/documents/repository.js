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

async function findDocumentWithBlocks(id) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });
}

async function deleteBlocksByDocumentId(documentId) {
  return prisma.block.deleteMany({
    where: {
      documentId,
    },
  });
}

async function createBlocks(blocks) {
  return prisma.block.createMany({
    data: blocks,
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
  findDocumentWithBlocks,
  deleteBlocksByDocumentId,
  createBlocks,
  updateDocumentById,
  deleteDocumentById,
};
