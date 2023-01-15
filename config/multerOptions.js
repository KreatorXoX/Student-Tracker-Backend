const { storage } = require("../config/cloudinaryOptions");
const multer = require("multer");

const upload = multer({ storage: storage });
module.exports = upload;
