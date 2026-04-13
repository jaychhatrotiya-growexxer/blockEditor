const express = require("express");
const { validate } = require("../../middleware/validate");
const { authenticateAccessToken } = require("../../middleware/authenticate");
const {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} = require("./controller");
const { loginSchema, registerSchema } = require("./validation");

const router = express.Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/me", authenticateAccessToken, meController);

module.exports = {
  authRouter: router,
};
