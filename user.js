const mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    image: String,
    username: String,
    phone: Number,
    password: String

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);