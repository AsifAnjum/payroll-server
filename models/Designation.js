const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    baseSalary: {
      type: Number,
      cast: "Number Only!",
      required: true,
    },
    designationId: {
      type: Number,
      // cast: [
      //   null,
      //   (value, path, model, kind) =>
      //     `"${value}" is not a number ${kind}, ${path}`,
      // ],
      cast: "Number Only!",
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

const Designation = mongoose.model("Designation", designationSchema);

module.exports = Designation;
