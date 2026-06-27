
const mongoose = require("mongoose");

const ChildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Child name is required"],
      trim: true,
      minlength: [1, "Child name is required"],
      maxlength: [30, "Child name cannot exceed 30 characters"],
    },

    age: {
      type: Number,
      required: [true, "Child age is required"],
      min: [1, "Child age must be at least 1"],
      max: [18, "Child age cannot exceed 18"],
    },

    gender: {
      type: String,
      required: [true, "Child gender is required"],
      enum: {
        values: ["male", "female"],
        message: "Gender must be male or female",
      },
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [
        300,
        "Parent notes cannot exceed 300 characters",
      ],
      default: "",
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Child", ChildSchema);

