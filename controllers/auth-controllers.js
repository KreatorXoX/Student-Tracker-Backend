const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }

  const { name, email, phoneNumber, password, role, busId } = req.body;

  const user = await UserModel.findOne({ email: email }).exec();

  if (user) {
    return next(new HttpError("already exists", 422));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let userImage = undefined;

  if (req.file) {
    userImage = { url: req.file.path, filename: req.file.filename };
  }

  let newUser;

  if (role === "employee") {
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

  await newUser.save();

  const accessToken = jwt.sign(
    {
      userId: foundUser.id,
      role: foundUser.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" }
  );
  const refreshToken = jwt.sign(
    { id: newUser.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwtToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs are being passed", 422));
  }
  const { email, password } = req.body;

  const foundUser = await UserModel.findOne({ email }).exec();

  if (!foundUser) {
    return next(new HttpError("Credentials are not matchig", 422));
  }

  const validUser = await bcrypt.compare(password, foundUser.password);

  if (!validUser) {
    return next(new HttpError("Credentials are not matchig", 422));
  }

  const accessToken = jwt.sign(
    {
      userId: foundUser.id,
      role: foundUser.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30m" }
  );
  const refreshToken = jwt.sign(
    { id: foundUser.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("jwtToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwtToken)
    return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwtToken;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbiden Access" });

      const foundUser = await UserModel.findById(decoded.id).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          userId: foundUser.id,
          role: foundUser.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30m" }
      );

      res.json({ accessToken });
    })
  );
});

const logout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwtToken) return res.sendStatus(204);
  res.clearCookie("jwtToken", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.json({ message: "Cookie cleared" });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
