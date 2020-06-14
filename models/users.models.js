var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username:{
        type: String,
        require: true
    },
    email: 
    {
        type:String,
        required: true,
        unique: true
    },
    password: {
        type:String,
        required: true
    },
    avata: {
        type:String,
        required: true
    },
    coverimage:{
        type:String,
        required: true
    }
});

var User = mongoose.model("User", userSchema, "users");

module.exports = User;