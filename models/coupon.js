const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: String,
  used: {
    type: Boolean,
    default: false
  },
  assignedTo: String,
});

module.exports = mongoose.model("Coupon", couponSchema);
