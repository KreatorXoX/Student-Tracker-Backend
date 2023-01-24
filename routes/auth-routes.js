const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const upload = require("../config/multerOptions");
const authController = require("../controllers/auth-controllers");

router
  .route("/register")
  .post(
    upload.single("image"),
    [
      check("name").not().isEmpty(),
      check("email").normalizeEmail(),
      check("password").isLength({ min: 5 }),
      check("phoneNumber").not().isEmpty(),
      check("role").not().isEmpty(),
    ],
    authController.register
  );

router
  .route("/login")
  .post(
    [check("email").isEmail(), check("password").isLength({ min: 5 })],
    authController.login
  );

router.route("/refresh").get(authController.refresh);

router.route("/logout").post(authController.logout);

module.exports = router;
