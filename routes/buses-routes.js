const express = require("express");
const { check } = require("express-validator");

const authCheck = require("../middleware/auth-check");

const busesControllers = require("../controllers/buses-controllers");

const router = express.Router();

router.use(authCheck);

router.get("/", busesControllers.getAllBuses);
router.get("/:busId", busesControllers.getBusById);

router.post(
  "/",
  [
    check("schoolName").not().isEmpty(),
    check("licensePlate").not().isEmpty(),
    check("busDriver").not().isEmpty(),
    check("studentHandler").not().isEmpty(),
  ],
  busesControllers.createBus
);

router.patch("/populate/:busId", busesControllers.populateBus);
router.patch("/:busId", busesControllers.updateBus);

router.delete("/:busId", busesControllers.deleteBus);

module.exports = router;
