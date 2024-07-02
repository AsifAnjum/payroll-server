const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  user,
  admin,
  hrManager,
  active,
  inactive,
  blocked,
} = require("../utils/constants");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minLength: [3, "Name must be at least 3 characters."],
      maxLength: [100, "Name is too large"],
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Provide a valid Email"],
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email address is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: {
        validator: (value) =>
          validator.isStrongPassword(value, {
            minLength: 4,
            minLowercase: 0,
            minNumbers: 1,
            minUppercase: 0,
            minSymbols: 0,
          }),
        message: "Password {VALUE} is not strong enough.",
      },
    },
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (value) {
          return value == this.password;
        },
        message: "Passwords don't match!",
      },
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Field Required!!!"],
    },
    role: {
      type: String,
      enum: [user, admin, hrManager],
      default: user,
    },
    contactNumber: {
      type: String,
      default: "",
    },
    imageURL: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          if (value === "") {
            return true;
          } else {
            return [validator.isURL, "please upload validate image"];
          }
        },
      },
    },
    birth: {
      type: Date,
      default: "",
    },
    dateOfJoining: {
      type: Date,
      default: "",
    },
    designation: {
      id: {
        type: ObjectId,
        ref: "Designation",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
    },
    salary: {
      type: Number,
      default: 0,
      cast: "Must be Number",
    },
    //percentage
    salaryAdjustment: {
      type: Number,
      min: -100,
      max: 100,
      default: 0,
      cast: "Must be Number",
    },
    payroll: [
      {
        type: ObjectId,
        ref: "Payroll",
      },
    ],
    address: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: inactive,
      enum: [active, inactive, blocked],
    },

    confirmationToken: String,
    confirmationTokenExpires: Date,

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    //  only run if password is modified, otherwise it will change every time we save the user!
    return next();
  }
  const password = this.password;

  const hashedPassword = bcrypt.hashSync(password);

  this.password = hashedPassword;
  this.confirmPassword = undefined;

  next();
});

userSchema.methods.comparePassword = function (password, hash) {
  return bcrypt.compareSync(password, hash);
};

userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = token;

  const date = new Date();

  date.setMinutes(date.getMinutes() + 5); // 5 minutes
  this.passwordResetExpires = date;

  return token;
};

userSchema.methods.generateConfirmationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.confirmationToken = token;

  const date = new Date();

  date.setMinutes(date.getMinutes() + 5); // 5 minutes
  this.confirmationTokenExpires = date;

  return token;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
