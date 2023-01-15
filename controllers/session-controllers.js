const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const HttpError = require("../models/http-error");
const SessionModel = require("../models/session-model");
const StudentModel = require("../models/student-model");
const { validationResult } = require("express-validator");

const newSession = asyncHandler(async (req, res, next) => {
  if (req.userData.role !== "employee") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }
  const {
    students,
    schoolName,
    busDriver,
    studentHandler,
    date,
    employeeId,
    busId,
  } = req.body;

  const newSess = new SessionModel({
    students,
    schoolName,
    busDriver,
    studentHandler,
    date,
    employeeId,
    busId,
  });

  const sess = await mongoose.startSession();
  sess.startTransaction();
  await newSess.save({ session: sess });

  for (let std of newSess.students) {
    await StudentModel.findByIdAndUpdate(
      std.id,
      {
        isOnTheBus: false,
        wasOnTheBus: false,
      },
      { session: sess }
    ).exec();
  }
  await sess.commitTransaction();

  res.json({ message: "Session saved successfuly" });
});

const getSessions = asyncHandler(async (req, res, next) => {
  if (req.userData.role === "parent") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }

  const sessions = await SessionModel.find({});

  res.json({ sessions: sessions });
});

exports.newSession = newSession;
exports.getSessions = getSessions;
