const express = require("express");
const { check } = require("express-validator");

const upload = require('../config/multerOptions')
const authCheck = require("../middleware/auth-check");

const studentsControllers = require("../controllers/students-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", studentsControllers.getAllStudents);
router.get("/:stdId", studentsControllers.getStudentById);
router.get("/bus/:busId", studentsControllers.getStudentsByBus);
router.get("/parent/:parentId", studentsControllers.getStudentsByParent);

router.post(
  "/new/:parentId",
  upload.single("image"),
  [
    check("name").notEmpty(),
    check("age").isInt({ min: 3 }),
    check("bloodType").isLength({ maxLength: 3 }),
    check("schoolName").notEmpty(),
  ],
  studentsControllers.createStudent
);

router.patch("/:stdId", studentsControllers.updateStudent);
router.patch("/updateStatus/:stdId", studentsControllers.onTheBusToggler);
router.patch("/updateLocation/:stdId", studentsControllers.updateLocation);

router.delete("/:stdId", studentsControllers.deleteStudent);

module.exports = router;
