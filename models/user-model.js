const mongoose = require("mongoose");
const Bus = require("../models/bus-model");
const Student = require("../models/student-model");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  image: {
    url: String,
    filename: String,
  },
  role: {
    type: String,
    enum: ["parent", "admin", "employee"],
    default: "parent",
  },
  children: [{ type: mongoose.Types.ObjectId, ref: "Student" }],
  busId: { type: mongoose.Types.ObjectId, ref: "Bus" },
});

UserSchema.post("findOneAndDelete", async function (doc, next) {
  if (doc && doc.role === "parent") {
    const { children, busId, _id } = doc;

    for (const childId of children) await Student.findByIdAndRemove(childId);
  }

  next();
});
module.exports = mongoose.model("User", UserSchema);
