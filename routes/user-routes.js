const express = require("express");
const { check } = require("express-validator");

const upload = require('../config/multerOptions')
const authCheck = require("../middleware/auth-check");

const userControllers = require("../controllers/user-controllers");

const router = express.Router();

router.post("/login", userControllers.loginUser);

router.post(
  "/register",
  upload.single("image"),
  [
    check("name").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 5 }),
  ],
  userControllers.registerUser
);

router.use(authCheck);

router.get("/user/:userId", userControllers.getUserById);
router.get("/:role", userControllers.getUsers);

router.patch("/:userId", userControllers.updateUser);
router.delete("/:userId", userControllers.deleteUser);

module.exports = router;
