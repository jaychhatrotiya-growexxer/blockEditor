const express = require("express");
const { HTTP_STATUS } = require("../utils/http-status");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  healthRouter: router,
};
