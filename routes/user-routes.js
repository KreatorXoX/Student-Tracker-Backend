const express = require("express");
const { check } = require("express-validator");

const authCheck = require("../middleware/auth-check");
const adminCheck = require("../middleware/admin-check");

const userControllers = require("../controllers/user-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/user/:userId", userControllers.getUserById);
router.get("/:role", userControllers.getUsersByRole);

router.patch(
  "/:userId",
  [
    check("name").notEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("phoneNumber").not().isEmpty(),
  ],
  userControllers.updateUser
);
router.delete("/:userId", adminCheck, userControllers.deleteUser);

module.exports = router;
