const {
  listDocumentsByUser,
  createDocument,
  deleteDocumentById,
  findDocumentById,
  updateDocumentById,
} = require("./repository");
const { AppError } = require("../../utils/app-error");
const { HTTP_STATUS } = require("../../utils/http-status");

async function getDocuments(userId) {
  return listDocumentsByUser(userId);
}

async function createNewDocument(userId, input) {
  const title = input.title?.trim() || "Untitled document";

  return createDocument({
    userId,
    title,
    updatedAt: new Date(),
  });
}

async function renameDocument(userId, id, input) {
  const document = await findDocumentById(id);

  if (!document) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND, {
      code: "DOCUMENT_NOT_FOUND",
    });
  }

  if (document.userId !== userId) {
    throw new AppError("Forbidden.", HTTP_STATUS.FORBIDDEN, {
      code: "DOCUMENT_FORBIDDEN",
    });
  }

  return updateDocumentById(id, {
    title: input.title.trim(),
    updatedAt: new Date(),
  });
}

async function removeDocument(userId, id) {
  const document = await findDocumentById(id);

  if (!document) {
    throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND, {
      code: "DOCUMENT_NOT_FOUND",
    });
  }

  if (document.userId !== userId) {
    throw new AppError("Forbidden.", HTTP_STATUS.FORBIDDEN, {
      code: "DOCUMENT_FORBIDDEN",
    });
  }

  await deleteDocumentById(id);

  return {
    id,
  };
}

module.exports = {
  getDocuments,
  createNewDocument,
  renameDocument,
  removeDocument,
};
