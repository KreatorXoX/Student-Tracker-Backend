const express = require("express");
const { check } = require("express-validator");

const authCheck = require("../middleware/auth-check");
const adminCheck = require("../middleware/admin-check");

const busesControllers = require("../controllers/buses-controllers");
const router = express.Router();

router.use(authCheck);

router.get("/", adminCheck, busesControllers.getAllBuses);
router.get("/:busId", busesControllers.getBusById);

router.post(
  "/",
  adminCheck,
  [
    check("schoolName").not().isEmpty(),
    check("licensePlate").not().isEmpty(),
    check("busDriver").not().isEmpty(),
    check("studentHandler").not().isEmpty(),
  ],
  busesControllers.createBus
);

router.patch("/populate/:busId", adminCheck, busesControllers.populateBus);
router.patch(
  "/:busId",
  adminCheck,
  [
    check("schoolName").not().isEmpty(),
    check("busDriver").not().isEmpty(),
    check("studentHandler").not().isEmpty(),
  ],
  busesControllers.updateBus
);

router.delete("/:busId", adminCheck, busesControllers.deleteBus);

module.exports = router;
