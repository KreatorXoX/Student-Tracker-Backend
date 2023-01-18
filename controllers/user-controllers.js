const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { cloudinary } = require("../config/cloudinaryOptions");

const HttpError = require("../models/http-error");
const UserModel = require("../models/user-model");

const removeStudent = require("../helpers/delete-students");
const asyncHandler = require("express-async-handler");

// const loginUser = asyncHandler(async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new HttpError("Invalid inputs are being passed", 422));
//   }

//   const { email, password } = req.body;

//   const foundUser = await UserModel.findOne({ email: email }).exec();

//   if (!foundUser) {
//     return next(new HttpError("Credentials are not matchig", 422));
//   }

//   const validUser = await bcrypt.compare(password, foundUser.password);

//   if (!validUser) {
//     return next(new HttpError("Credentials are not matchig", 422));
//   }

//   const token = jwt.sign(
//     { userId: foundUser.id, role: foundUser.role },
//     process.env.JWT_KEY,
//     { expiresIn: "1h" }
//   );

//   res.status(200).json({
//     message: "Logged In",
//     userInfo: {
//       role: foundUser.role,
//       id: foundUser.id,
//       busId: foundUser.busId ? foundUser.busId : undefined,
//     },
//     token: token,
//   });
// });

// const registerUser = asyncHandler(async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new HttpError("Invalid inputs are being passed", 422));
//   }

//   const { name, email, phoneNumber, password, role, busId } = req.body;

//   const user = await UserModel.findOne({ email: email }).exec();

//   if (user) {
//     return next(new HttpError("already exists", 422));
//   }

//   const hashedPassword = await bcrypt.hash(password, 12);

//   let userImage = undefined;
//   if (req.file) {
//     userImage = { url: req.file.path, filename: req.file.filename };
//   }

//   let newUser;

//   if (role === "employee") {
//     newUser = new UserModel({
//       name,
//       image: userImage,
//       password: hashedPassword,
//       email,
//       phoneNumber,
//       role,
//       busId,
//     });
//   } else {
//     newUser = new UserModel({
//       name,
//       image: userImage,
//       password: hashedPassword,
//       email,
//       phoneNumber,
//       role,
//     });
//   }

//   await newUser.save();

//   res.status(200).json({
//     message: "Registered new user",
//     userRole: {
//       role: newUser.role,
//       id: busId ? busId : newUser._id,
//     },
//   });
// });

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

  const hashedPassword = await bcrypt.hash(password, 12);

  await UserModel.findByIdAndUpdate(userId, {
    email: email,
    name: name,
    password: hashedPassword,
    phoneNumber: phoneNumber,
  }).exec();

  res.status(200).json({ message: "User Updated" });
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const sess = await mongoose.startSession();
  sess.startTransaction();
  const user = await UserModel.findById(userId);
  const userImage = user.image.filename;
  for (let child of user.children) {
    await removeStudent(child);
  }
  await user.remove({ session: sess });
  await sess.commitTransaction();

  await cloudinary.uploader.destroy(userImage);
  res.status(200).json({ message: "Deleted user" });
});

// exports.loginUser = loginUser;
// exports.registerUser = registerUser;
exports.getUsersByRole = getUsersByRole;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
