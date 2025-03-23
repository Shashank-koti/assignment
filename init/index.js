const mongoose =require("mongoose");
const Coupon = require("../models/coupon");
const sampleCoupon = require("./data");
const Admin = require("../models/admin");

mongoose.connect("mongodb+srv://shashankkoti05:assignment@assignmentcluster.o82ca.mongodb.net/?retryWrites=true&w=majority&appName=assignmentCluster").then(()=>{
    console.log("connected to db");
});

const sampleData = async()=>{
    await Coupon.deleteMany({});
    let newData = await Coupon.insertMany(sampleCoupon);
    console.log("data assigned");
}

sampleData();
