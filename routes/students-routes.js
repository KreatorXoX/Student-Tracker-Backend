const express = require("express");
const { check } = require("express-validator");

const upload = require("../config/multerOptions");
const authCheck = require("../middleware/auth-check");
const adminCheck = require("../middleware/admin-check");

const studentsControllers = require("../controllers/students-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", adminCheck, studentsControllers.getStudents);
router.get("/:stdId", studentsControllers.getStudentById);
router.get("/bus/:busId", studentsControllers.getStudentsByBus);

router.post(
  "/new/:parentId",
  adminCheck,
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

router.delete("/:stdId", adminCheck, studentsControllers.deleteStudent);

module.exports = router;
