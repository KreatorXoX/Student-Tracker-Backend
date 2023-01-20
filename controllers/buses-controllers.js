const { validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const HttpError = require("../models/http-error");
const BusModel = require("../models/bus-model");
const StudentModel = require("../models/student-model");

const getAllBuses = asyncHandler(async (req, res, next) => {
  const allBuses = await BusModel.find();

  if (!allBuses || allBuses.length === 0) {
    return next(new HttpError("No bus found", 404));
  }

  res
    .status(200)
    .json({ buses: allBuses.map((bus) => bus.toObject({ getters: true })) });
});

const getBusById = asyncHandler(async (req, res, next) => {
  const { busId } = req.params;

  const bus = await BusModel.findById(busId).exec();

  if (!bus) {
    return next(new HttpError("no buses found with the given id", 404));
  }

  res.json({ bus: bus.toObject({ getters: true }) });
});

const createBus = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { schoolName, licensePlate, busDriver, studentHandler } = req.body;

  const newBus = new BusModel({
    schoolName,
    licensePlate,
    busDriver,
    studentHandler,
    students: [],
  });

  await newBus.save();

  res.status(201).json({ bus: newBus.toObject({ getters: true }) });
});

const updateBus = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { schoolName, busDriver, studentHandler } = req.body;
  const busId = req.params.busId;

  let busCapacity = 0;

  const updatedBus = await BusModel.findById(busId).exec();

  if (!updatedBus) {
    return next(new HttpError("No bus found with the given id", 404));
  }

  // if bus is assigned to new school, reset the capacity and remove busId from the previous students
  if (updatedBus.schoolName !== schoolName) {
    updatedBus.schoolName = schoolName;
    updatedBus.students = [];

    busCapacity = await StudentModel.updateMany(
      { busId: updatedBus._id },
      { busId: null }
    ).exec();
    updatedBus.capacity += busCapacity.modifiedCount;
  }

  updatedBus.busDriver = busDriver;
  updatedBus.studentHandler = studentHandler;
  await updatedBus.save();

  res.status(200).json({ bus: updatedBus.toObject({ getters: true }) });
});

const deleteBus = asyncHandler(async (req, res, next) => {
  const { busId } = req.params;

  const deletedBus = await BusModel.findById(busId).exec();

  if (!deletedBus) {
    return next(new HttpError("No bus found with the given bus-id", 404));
  }

  // remove busId from students.
  await StudentModel.updateMany(
    { busId: deletedBus._id },
    { busId: null }
  ).exec();

  // remove bus
  await deletedBus.remove();

  res.status(200).json({ message: "Bus Deleted Successfuly" });
});

const populateBus = asyncHandler(async (req, res, next) => {
  const { busId } = req.params;

  const busToPopulate = await BusModel.findById(busId).exec();

  if (!busToPopulate) {
    return next(new HttpError("No bus found with the given bus-id", 404));
  }

  // assigning the student who are not assigned a bus and their schoolname is the same with the bus's schoolname
  const returnData = await StudentModel.updateMany(
    { busId: null, schoolName: busToPopulate.schoolName },
    { busId: busToPopulate._id },
    { new: true }
  ).exec();

  // find how many students are assigned to the bus so we can substract it from the capacity
  const populateCount = returnData.modifiedCount;

  const students = await StudentModel.find({ busId: busToPopulate._id }).exec();

  if (!students) {
    return next(new HttpError("No students found to insert to bus", 404));
  }

  for (let std of students) {
    busToPopulate.students.push(std);
  }
  busToPopulate.capacity -= populateCount;
  await busToPopulate.save();

  res.status(200).json({
    id: busId,
    students: students.map((std) => std.toObject({ getters: true })),
  });
});

exports.getAllBuses = getAllBuses;
exports.getBusById = getBusById;
exports.createBus = createBus;
exports.updateBus = updateBus;
exports.deleteBus = deleteBus;
exports.populateBus = populateBus;
