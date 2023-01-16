const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/dbConnection");
const corsOpts = require("./config/corsOptions");
const HttpError = require("./models/http-error");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT || 5000;

connectDB();

const app = express();

// for cors settings
app.use(cors(corsOpts));
// for parsing the data attached to req.body
app.use(bodyParser.json());
// for parsing and reading the cookies.
app.use(cookieParser());

// setting different routes for api endpoints
app.use("/api/auth", require("./routes/auth-routes"));
app.use("/api/users", require("./routes/user-routes"));
app.use("/api/students", require("./routes/students-routes"));
app.use("/api/buses", require("./routes/buses-routes"));
app.use("/api/sessions", require("./routes/session-routes"));

// for unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// for errors thrown in the routes
app.use(errorHandler);

// mongo connection check and log errors if any
mongoose.connection.once("open", () => {
  console.log("open connection to server");
  app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  });
});

mongoose.connection.on("err", (err) => {
  console.error(err);
});
