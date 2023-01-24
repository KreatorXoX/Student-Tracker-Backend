const mongoose = require("mongoose");
const Parent = require("../models/user-model");
const Bus = require("../models/bus-model");
const HttpError = require("../models/http-error");
const { cloudinary } = require("../config/cloudinaryOptions");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  name: { type: String, required: true },
  image: { url: String, filename: String },
  schoolName: { type: String, required: true },
  isComing: { type: Boolean, default: true },
  isOnTheBus: { type: Boolean, default: false },
  wasOnTheBus: { type: Boolean, default: false },
  age: { type: Number, required: true },
  bloodType: { type: String, required: true, maxLength: 3 },
  alergies: [{ type: String }],
  knownDiseases: [{ type: String }],
  emergencyContacts: [
    {
      name: {
        type: String,
        required: true,
      },
      howRelated: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
    },
  ],
  parentId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  busId: { type: mongoose.Types.ObjectId, required: true, ref: "Bus" },
  location: {
    lat: { type: String, default: "" },
    lng: { type: String, default: "" },
  },
});
StudentSchema.post("findOneAndRemove", async function (doc, next) {
  if (doc) {
    const { busId, _id, image } = doc;
    let bus;
    try {
      bus = await Bus.findById(busId).exec();
    } catch (error) {
      return next(new HttpError("Error in Post Delete by parent"));
    }

    if (!bus) {
      return next(new HttpError("No bus found with the given id", 404));
    }
    bus.students.pull(_id);
    bus.capacity += 1;
    await bus.save();
    await cloudinary.uploader.destroy(image.filename);
  }
  next();
});
StudentSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc) {
    const { parentId, busId, _id } = doc;
    let parent;
    let bus;
    const imageKey = doc.image.filename;
    try {
      parent = await Parent.findById(parentId).exec();
      bus = await Bus.findById(busId).exec();
    } catch (error) {
      return next(new HttpError("Error in Post Delete", 500));
    }
    if (!parent) {
      return next(new HttpError("No parent found with the given id", 404));
    }
    if (!bus) {
      return next(new HttpError("No bus found with the given id", 404));
    }

    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      parent.children.pull(_id);
      bus.students.pull(_id);
      bus.capacity += 1;
      await parent.save({ session: sess });
      await bus.save({ session: sess });
      await sess.commitTransaction();
    } catch (error) {
      return next(
        new HttpError(
          "Something went wrong when trying to remove student from the Post Middleware s",
          500
        )
      );
    }

    await cloudinary.uploader.destroy(imageKey);
  }
  next();
});

module.exports = mongoose.model("Student", StudentSchema);
