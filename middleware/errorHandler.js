const { cloudinary } = require("../config/cloudinaryOptions");

const errorHandler = async (err, req, res, next) => {
  if (req.file) {
    //if there is an error in the routes and if there is a req.file attr.
   await cloudinary.uploader.destroy(req.file.filename);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.code || 500);
  res.json({ message: err.message || "An unknown error occurred!" });
};

module.exports = errorHandler;
