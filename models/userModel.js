const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true,"Please add a name"]
    },
    email: {
        type: String,
        required:[true,"Please add a email"],
        unique: true,
        trime: true,
        match:[
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"
        ]
    },
    password:{
        type: String,
        required: [true,"Please add a password"],
        minLength:[6, "Password must be up to 6 chars"],
        //maxLength:[23,"Password must be less than 23 chars"]
    },
    photo: {
        type: String,
        required: [true,"Please add a photo"],
        default: "https://i.pinimg.com/736x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg"
    },
    phone: {
        type: String,
        default: "+34"
    },
    bio: {
        type: String,
        maxLength:[250,"Password must be less than 23 chars"],
        default: "bio"
    }
}, {
    timestamps: true,
});

//Encrypt password before saving to DB
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return next();
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;