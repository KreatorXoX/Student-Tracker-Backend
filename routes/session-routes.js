const express = require("express");
const { check } = require("express-validator");
const authCheck = require("../middleware/auth-check");

const sessionControllers = require("../controllers/session-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", sessionControllers.getSessions);

router.post(
  "/",
  [
    check("students").not().isEmpty(),
    check("schoolName").not().isEmpty(),
    check("busDriver").not().isEmpty(),
    check("studentHandler").not().isEmpty(),
    check("date").not().isEmpty(),
    check("employeeId").not().isEmpty(),
    check("busId").not().isEmpty(),
  ],
  sessionControllers.newSession
);

module.exports = router;
