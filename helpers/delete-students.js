const mongoose = require("mongoose");
const { cloudinary } = require("../config/cloudinaryOptions");

const HttpError = require("../models/http-error");
const StudentModel = require("../models/student-model");
const BusModel = require("../models/bus-model");
const UserModel = require("../models/user-model");

const removeStudent = async (stdId) => {
  let student;

  try {
    student = await StudentModel.findById(stdId).exec();
  } catch (error) {
    new HttpError("Couldnt access to DB to get the student data", 500);
  }

  if (!student) {
    return next(new HttpError("No students found with the given id", 404));
  }

  let bus;

  try {
    bus = await BusModel.findById(student.busId).exec();
  } catch (error) {
    new HttpError("Couldnt access to DB to get the bus data", 500);
  }

  if (!bus) {
    return next(new HttpError("No bus found with the given id", 404));
  }

  let parent;

  try {
    parent = await UserModel.findOne({ children: stdId }).exec();
  } catch (error) {
    new HttpError("Couldnt access to DB to get the parent data", 500);
  }

  if (!parent) {
    return next(new HttpError("No parent found with the given id", 404));
  }

  const imageKey = student.image.filename;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    parent.children.pull(student);
    bus.students.pull(student);
    bus.capacity += 1;
    await parent.save({ session: sess });
    await bus.save({ session: sess });
    await student.remove({ session: sess });

    await sess.commitTransaction();
  } catch (error) {
    return next(
      new HttpError(
        "Something went wrong when trying to remove student from the Database",
        500
      )
    );
  }
  await cloudinary.uploader.destroy(imageKey);
};

module.exports = removeStudent;
