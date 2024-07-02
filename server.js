const mongoose = require("mongoose");
require("dotenv").config();
const app = require("./app");

//db connection

const uri = process.env.DB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("Successfully connected to the database"))
  .catch((err) => console.log(`database error ${err}`));

app.listen(process.env.PORT || 8000, () =>
  console.log(`App is running on port ${8000}`)
);
