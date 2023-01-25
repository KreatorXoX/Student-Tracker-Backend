const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const { cloudinary } = require("../config/cloudinaryOptions");

const HttpError = require("../models/http-error");
const UserModel = require("../models/user-model");

const asyncHandler = require("express-async-handler");

const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (req.userData.userId !== userId)
    if (req.userData.role !== "admin")
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );

  const user = await UserModel.findById(userId, "-password")
    .populate("busId")
    .exec();

  if (!user) {
    return next(new HttpError("No user found with the given id", 404));
  }

  res.status(200).json({
    user: user.toObject({ getters: true }),
  });
});

const getUsersByRole = asyncHandler(async (req, res, next) => {
  const { role } = req.params;

  const users = await UserModel.find({ role: role }, "-password").exec();

  if (!users || users.length === 0) {
    return next(new HttpError("No user found", 404));
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
});

const updateUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (req.userData.userId !== userId)
    if (req.userData.role !== "admin")
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { password, email, name, phoneNumber } = req.body;

  const user = await UserModel.findById(userId).exec();

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
  }
  user.email = email;
  user.name = name;
  user.phoneNumber = phoneNumber;
  await user.save();

  res.status(200).json({ message: "User Updated", id: userId });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const user = await UserModel.findByIdAndDelete(userId).exec();

  await cloudinary.uploader.destroy(user.image.filename);
  res.status(200).json({ message: "Deleted user" });
});

exports.getUsersByRole = getUsersByRole;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
