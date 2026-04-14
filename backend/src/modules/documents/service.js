const {
  listDocumentsByUser,
  createDocument,
  deleteDocumentById,
  findDocumentById,
  findDocumentWithBlocks,
  deleteBlocksByDocumentId,
  createBlocks,
  updateDocumentById,
} = require("./repository");
const { AppError } = require("../../utils/app-error");
const { HTTP_STATUS } = require("../../utils/http-status");

async function getDocuments(userId) {
  return listDocumentsByUser(userId);
}

async function getDocumentById(userId, id) {
  const document = await findDocumentWithBlocks(id);

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

  return {
    id: document.id,
    title: document.title,
    updatedAt: document.updatedAt,
    isPublic: document.isPublic,
    blocks: document.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content,
      orderIndex: block.orderIndex,
      parentId: block.parentId,
    })),
  };
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

async function saveDocument(userId, id, input) {
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

  const updateData = {
    updatedAt: new Date(),
  };

  if (input.title != null) {
    updateData.title = input.title.trim();
  }

  await deleteBlocksByDocumentId(id);

  if (Array.isArray(input.blocks)) {
    const blockData = input.blocks.map((block) => ({
      id: block.id,
      documentId: id,
      type: block.type,
      content: block.content,
      orderIndex: block.orderIndex,
      parentId: block.parentId ?? null,
    }));

    if (blockData.length > 0) {
      await createBlocks(blockData);
    }
  }

  await updateDocumentById(id, updateData);

  return getDocumentById(userId, id);
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
  getDocumentById,
  createNewDocument,
  renameDocument,
  saveDocument,
  removeDocument,
};
