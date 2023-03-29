const mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
const blogSchema = new mongoose.Schema({
    // title: String,
    content: String,
    image: String,
    username:String,
    date: Date
});
blogSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Blog", blogSchema);