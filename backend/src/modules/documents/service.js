const crypto = require("crypto");
const {
  listDocumentsByUser,
  createDocument,
  deleteDocumentById,
  findDocumentById,
  findDocumentByShareToken,
  findDocumentWithBlocks,
  deleteBlocksByDocumentId,
  createBlocks,
  updateDocumentById,
} = require("./repository");
const { AppError } = require("../../utils/app-error");
const { HTTP_STATUS } = require("../../utils/http-status");

function serializeDocument(document, { includeShareToken = false } = {}) {
  return {
    id: document.id,
    title: document.title,
    updatedAt: document.updatedAt,
    isPublic: document.isPublic,
    shareToken: includeShareToken ? document.shareTokenHash : undefined,
    blocks: Array.isArray(document.blocks)
      ? document.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          content: block.content,
          orderIndex: block.orderIndex,
          parentId: block.parentId,
        }))
      : undefined,
  };
}

async function requireOwnedDocument(userId, id) {
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

  return document;
}

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

  return serializeDocument(document, { includeShareToken: true });
}

async function getDocumentByShareToken(shareToken) {
  const document = await findDocumentByShareToken(shareToken);

  if (!document) {
    throw new AppError("Shared document not found or expired.", HTTP_STATUS.NOT_FOUND, {
      code: "SHARED_DOCUMENT_NOT_FOUND",
    });
  }

  return serializeDocument(document);
}

async function createNewDocument(userId, input) {
  const title = input.title?.trim() || "Untitled document";

  return createDocument({
    userId,
    title,
    updatedAt: new Date(),
    blocks: {
      create: {
        type: "paragraph",
        content: {
          text: "",
        },
        orderIndex: 0,
      },
    },
  });
}

async function renameDocument(userId, id, input) {
  await requireOwnedDocument(userId, id);

  return updateDocumentById(id, {
    title: input.title.trim(),
    updatedAt: new Date(),
  });
}

async function saveDocument(userId, id, input) {
  await requireOwnedDocument(userId, id);

  const updateData = {
    updatedAt: new Date(),
  };

  if (input.title != null) {
    updateData.title = input.title.trim();
  }

  if (Array.isArray(input.blocks)) {
    await deleteBlocksByDocumentId(id);

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
  await requireOwnedDocument(userId, id);

  await deleteDocumentById(id);

  return {
    id,
  };
}

async function createShareLink(userId, id) {
  const document = await requireOwnedDocument(userId, id);
  const shareToken =
    document.shareTokenHash || crypto.randomBytes(24).toString("base64url");

  await updateDocumentById(id, {
    shareTokenHash: shareToken,
    isPublic: true,
    updatedAt: new Date(),
  });

  return {
    id,
    isPublic: true,
    shareToken,
  };
}

async function expireShareLink(userId, id) {
  await requireOwnedDocument(userId, id);

  await updateDocumentById(id, {
    shareTokenHash: null,
    isPublic: false,
    updatedAt: new Date(),
  });

  return {
    id,
    isPublic: false,
    shareToken: null,
  };
}

module.exports = {
  getDocuments,
  getDocumentById,
  getDocumentByShareToken,
  createNewDocument,
  renameDocument,
  saveDocument,
  removeDocument,
  createShareLink,
  expireShareLink,
};
