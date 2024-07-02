const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      id: {
        type: ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      designation: {
        type: String,
        required: true,
      },
    },
    bonus: {
      type: Number,
      min: 0,
      default: 0,
    },
    penalty: {
      type: Number,
      min: 0,
      default: 0,
    },
    payrollMonth: {
      type: String,
      required: [true, "field required"],
      validate: {
        validator: function (v) {
          return /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b-\d{4}/.test(
            v
          );
        },
        message: (props) => `${props.value} is not a valid month and year!`,
      },
      default: "",
    },
    payroll: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = Payroll;
