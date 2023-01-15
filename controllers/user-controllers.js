const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { cloudinary } = require("../config/cloudinaryOptions");

const HttpError = require("../models/http-error");
const UserModel = require("../models/user-model");

const removeStudent = require("../helpers/delete-students");

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  let foundUser;

  try {
    foundUser = await UserModel.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Cant access to db", 500));
  }

  if (!foundUser) {
    return next(new HttpError("Credentials are not matchig", 422));
  }

  let validUser = false;

  try {
    validUser = await bcrypt.compare(password, foundUser.password);
  } catch (error) {
    return next(new HttpError("Comparing hashed password failed", 500));
  }

  if (!validUser) {
    return next(new HttpError("Credentials are not matchig", 422));
  }

  let token;

  try {
    token = jwt.sign(
      { userId: foundUser.id, role: foundUser.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Creating JWT failed", 500));
  }

  res.status(200).json({
    message: "Logged In",
    userInfo: {
      role: foundUser.role,
      id: foundUser.id,
      busId: foundUser.busId ? foundUser.busId : "",
    },
    token: token,
  });
};

const registerUser = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { name, email, phoneNumber, password, role, busId } = req.body;

  let user;

  try {
    user = await UserModel.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Couldnt find user", 500));
  }

  if (user) {
    return next(new HttpError("already exists", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    return next(
      new HttpError("Hashing the password failed, try again later", 500)
    );
  }

  let userImage = undefined;
  if (req.file) {
    userImage = { url: req.file.path, filename: req.file.filename };
  }

  let newUser;

  if (role === "parent") {
    newUser = new UserModel({
      name,
      image: userImage,
      password: hashedPassword,
      email,
      phoneNumber,
      role,
    });
  } else if (role === "employee") {
    newUser = new UserModel({
      name,
      image: userImage,
      password: hashedPassword,
      email,
      phoneNumber,
      role,
      busId,
    });
  } else {
    newUser = new UserModel({
      name,
      image: userImage,
      password: hashedPassword,
      email,
      phoneNumber,
      role,
    });
  }

  try {
    await newUser.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError("Couldnt create user", 500));
  }

  res.status(200).json({
    message: "Registered new user",
    userRole: {
      role: newUser.role,
      id: busId ? busId : newUser._id,
    },
  });
};

const getUserById = async (req, res, next) => {
  const { userId } = req.params;

  if (req.userData.role !== "admin") {
    do {
      if (req.userData.userId === userId) break;
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
    } while (false);
  }

  let user;

  try {
    user = await UserModel.findById(userId, "-password").populate("busId");
  } catch (error) {
    return next(new HttpError("Couldnt connect to db to fetch user", 500));
  }

  if (!user) {
    return next(new HttpError("No user found with the given id", 404));
  }

  // do {
  //   if (user.imageExp && user.imageExp.getTime() > new Date()) {
  //     break;
  //   }
  //   const { client, command } = AwsCommand("get", user.imageKey);
  //   const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  //   user.image = url;
  //   user.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
  //   await user.save();
  // } while (false);

  res.status(200).json({
    user: user.toObject({ getters: true }),
  });
};
const getUsers = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { role } = req.params;
  let users;

  try {
    users = await UserModel.find({ role: role }, "-password");
  } catch (error) {
    return next(new HttpError("Couldnt connect to db to retrieve users", 500));
  }

  if (!users || users.length === 0) {
    return next(new HttpError("No user found", 404));
  }

  // for (const user of users) {
  //   if (user.imageExp && user.imageExp.getTime() > new Date()) {
  //     continue;
  //   }

  //   const { client, command } = AwsCommand("get", user.imageKey);

  //   const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  //   user.image = url;
  //   user.imageExp = new Date(new Date().getTime() + 1000 * 60 * 60);
  //   await user.save();
  // }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

// const getParentByStudentId = async (req, res, next) => {
//   const studentId = req.params.stdId;

//   let parent;
//   try {
//     parent = await UserModel.find(
//       { children: { $in: studentId } },
//       "-password"
//     );
//   } catch (error) {
//     return next(new HttpError("Couldnt connect to db to retrieve parent", 500));
//   }

//   res.json({ parent: parent });
// };

const updateUser = async (req, res, next) => {
  const { userId } = req.params;

  if (req.userData.role !== "admin") {
    do {
      if (req.userData.userId === userId) break;
      return next(
        new HttpError("You are not authorized to do this operation!!!", 401)
      );
    } while (false);
  }

  const { password, email, name, phoneNumber } = req.body;

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {}

  try {
    await UserModel.findByIdAndUpdate(userId, {
      email: email,
      name: name,
      password: hashedPassword || password,
      phoneNumber: phoneNumber,
    });
  } catch (error) {
    return next(new HttpError("Couldnt connect to db to update user", 500));
  }

  res.status(200).json({ message: "User Updated" });
};

const deleteUser = async (req, res, next) => {
  if (req.userData.role !== "admin") {
    return next(
      new HttpError("You are not authorized to do this operation!!!", 401)
    );
  }
  const { userId } = req.params;

  let userImage;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    const user = await UserModel.findById(userId);
    userImage = user.image.filename;
    for (let child of user.children) {
      await removeStudent(child);
    }
    await user.remove({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Couldnt connect to db to retrieve user", 500));
  }
  cloudinary.uploader.destroy(userImage);
  res.status(200).json({ message: "Deleted user" });
};

exports.loginUser = loginUser;
exports.registerUser = registerUser;
exports.getUsers = getUsers;
exports.getUserById = getUserById;
//exports.getParentByStudentId = getParentByStudentId;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
