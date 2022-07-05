const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },

  password: {
    type: String,
    minLength: 8,
    required: true,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },

  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("User", userSchema);