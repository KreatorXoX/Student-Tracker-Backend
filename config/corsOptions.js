const corsOpts = {
  // origin: function (origin, callback) {
  //   if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error("Cors origin not allowed"));
  //   }
  // },
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200, // def:204 for smart tvs and some old browsers support
};

module.exports = corsOpts;
