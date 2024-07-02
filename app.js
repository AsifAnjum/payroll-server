const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const cookieParser = require("cookie-parser");

const { response } = require("./utils/helperFunctions");

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//routes import
const designationRoute = require("./routes/designationRoute");
const userRoute = require("./routes/userRoute");
const payrollRoute = require("./routes/payrollRoute");

//routes
const apiV1 = "/api/v1";

app.get("/", (req, res) => {
  res.send("Hey!!!");
});

app.use(`${apiV1}/designation`, designationRoute);
app.use(`${apiV1}/user`, userRoute);
app.use(`${apiV1}/payroll`, payrollRoute);

//default error handler
const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code == "LIMIT_FILE_SIZE") {
      return response(
        res,
        400,
        "failed",
        `File size exceeds the maximum limit of 2 Mb.`
      );
    }

    return response(
      res,
      error.statusCode || 400,
      "failed",
      error.message,
      error
    );
  }

  response(res, error.statusCode || 500, "failed", error.message);
};

app.use(errorHandler);

//non-exist routes
app.all("*", (req, res) => {
  res.status(404).send("Invalid Address");
});

module.exports = app;
