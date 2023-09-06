const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
    location:{
        type: String,
        required: true,
    }
})

const Token = mongoose.model("Location", locationSchema);

module.exports = Token;