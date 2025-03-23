const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    isClaimed: {
        type: Boolean, 
        default: false 
    },
    claimedBy: {
        ip: String,
        cookieId: String,
        timestamp: Date
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    code:{
        type: String,
        required: true
    }
});

module.exports = mongoose.model("User",userSchema);