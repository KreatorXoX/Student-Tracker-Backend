const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

const HttpError = require("../models/http-error");
const StudentModel = require("../models/student-model");
const BusModel = require("../models/bus-model");
const UserModel = require("../models/user-model");

const { cloudinary } = require("../config/cloudinaryOptions");

const getStudents = asyncHandler(async (req, res, next) => {
  const { by, id } = req.query;

  let students;

  if (by === "bus") {
    students = await StudentModel.find({ busId: id }).exec();
  } else if (by === "parent") {
    students = await StudentModel.find({ parentId: id }).exec();
  } else {
    students = await StudentModel.find();
  }

  if (!students || students.length === 0) {
    return next(new HttpError("No students found", 404));
  }

  res.status(200).json({
    students: students.map((student) => student.toObject({ getters: true })),
  });
});

const getStudentById = asyncHandler(async (req, res, next) => {
  const { stdId } = req.params;

  const student = await StudentModel.findById(stdId).exec();

  if (!student) {
    return next(new HttpError("No students found with the given id", 404));
  }

  if (req.userData.userId !== student.parentId.toString()) {
    if (req.userData.role !== "admin")
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
  }
  res.json({ student: student.toObject({ getters: true }) });
});

const getStudentsByBus = asyncHandler(async (req, res, next) => {
  if (req.userData.role === "parent") {
    return next(new HttpError("Forbiden route !!!", 403));
  }
  const { busId } = req.params;

  const students = await StudentModel.find({ busId: busId })
    .populate("busId")
    .exec();

  if (students.length === 0) {
    return next(new HttpError("No student found on the given bus ID", 404));
  }

  res.status(200).json({
    students: students.map((student) => student.toObject({ getters: true })),
    schoolName: students[0].busId.schoolName,
    busDriver: students[0].busId.busDriver.name,
    studentHandler: students[0].busId.studentHandler.name,
    busId: busId,
  });
});

const createStudent = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { parentId } = req.params;

  const {
    name,
    schoolName,
    age,
    bloodType,
    alergies,
    knownDiseases,
    emergencyContacts,
  } = req.body;

  const contacts = JSON.parse(emergencyContacts);

  const parent = await UserModel.findById(parentId).exec();

  if (!parent) {
    return next(
      new HttpError("Couldnt find a parent with the given parent id", 404)
    );
  }

  const bus = await BusModel.findOne({ schoolName: schoolName }).exec();

  if (!bus) {
    return next(new HttpError("Couldnt find a bus with the given bus id", 404));
  }

  let stdImage;
  if (req.file) {
    stdImage = { url: req.file.path, filename: req.file.filename };
  }

  const newStudent = new StudentModel({
    name,
    image: stdImage,
    schoolName,
    age,
    bloodType,
    alergies,
    knownDiseases,
    emergencyContacts: [...contacts],
    busId: bus._id,
    parentId,
  });

  const sess = await mongoose.startSession();
  sess.startTransaction();
  await newStudent.save({ session: sess });
  parent.children.push(newStudent);
  bus.students.push(newStudent);
  bus.capacity -= 1;
  await parent.save({ session: sess });
  await bus.save({ session: sess });
  await sess.commitTransaction();

  res.status(201).json({ student: newStudent.toObject({ getters: true }) });
});

const updateStudent = asyncHandler(async (req, res, next) => {
  const {
    name,
    schoolName,
    alergies,
    knownDiseases,
    bloodType,
    age,
    isComing,
  } = req.body;

  const { stdId } = req.params;
  const updatedStudent = await StudentModel.findById(stdId)
    .populate("parentId")
    .exec();

  if (!updatedStudent) {
    return next(new HttpError("Couldnt find a student with the given id", 404));
  }

  if (req.userData.userId !== updatedStudent.parentId._id)
    if (req.userData.role !== "admin")
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );

  // if students school is updated we need to update the bus as well as adding the student to the new bus !
  if (schoolName !== updatedStudent.schoolName) {
    const oldBus = await BusModel.findById(updatedStudent.busId).exec();

    if (!oldBus) {
      return next(new HttpError("Couldnt find a bus with the given id", 404));
    }

    const newBus = await BusModel.findOne({ schoolName: schoolName }).exec();

    if (!newBus) {
      return next(
        new HttpError("Couldnt find a bus with the given schoolname", 404)
      );
    }

    updatedStudent.schoolName = schoolName;
    updatedStudent.busId = newBus._id ? newBus._id : updatedStudent.busId;

    const sess = await mongoose.startSession();
    sess.startTransaction();
    oldBus.students.pull(updatedStudent);
    oldBus.capacity += 1;
    newBus.students.push(updatedStudent);
    newBus.capacity -= 1;
    await oldBus.save({ session: sess });
    await newBus.save({ session: sess });
    await sess.commitTransaction();
  }

  updatedStudent.name = name;
  updatedStudent.age = age;
  updatedStudent.bloodType = bloodType;
  updatedStudent.alergies = alergies;
  updatedStudent.knownDiseases = knownDiseases;
  updatedStudent.isComing = isComing;

  await updatedStudent.save();

  res.status(200).json({ student: updatedStudent.toObject({ getters: true }) });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { stdId } = req.params;

  const deletedStudent = await StudentModel.findByIdAndDelete({
    _id: stdId,
  }).exec();

  await cloudinary.uploader.destroy(deletedStudent.image.filename);

  res.status(200).json({ message: "Deletion Successful" });
});

const onTheBusToggler = asyncHandler(async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const studentId = req.params.stdId;
  const studentState = req.body.state;

  const student = await StudentModel.findById(studentId).exec();

  student.isOnTheBus = studentState;
  student.wasOnTheBus = true;
  await student.save();

  res
    .status(200)
    .json({ id: studentId, message: "Presence Status updated successfuly" });
});

const updateLocation = asyncHandler(async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const { location } = req.body;
  const { stdId } = req.params;
  const student = await StudentModel.findById(stdId).exec();

  if (!student) {
    return next(new HttpError("No students found with the given id", 404));
  }

  student.location.lat = location.lat;
  student.location.lng = location.lng;

  await student.save();

  res.status(200).json({ id: stdId, message: "Location updated successfuly" });
});

exports.getStudents = getStudents;
exports.getStudentById = getStudentById;
exports.getStudentsByBus = getStudentsByBus;
exports.createStudent = createStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.onTheBusToggler = onTheBusToggler;
exports.updateLocation = updateLocation;
