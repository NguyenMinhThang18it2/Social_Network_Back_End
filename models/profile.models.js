var mongoose = require('mongoose');

var profileSchema = new mongoose.Schema({
    iduser: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    },
    profile:{
        gender:{
            type: String,
            require: true
        },
        phone:{
            type: String,
            require: true
        },
        dateofbirth:{
            type: Date,
            require: true
        },
        nickname:{
            type: String,
            require: true
        } 
    },
    education:{
        typeeducation:{
            type:String,
            require: true
        },
        school :{
            type: String,
            require: true
        }
    },
    placeslive:{
        type: String,
        require: true
    },
    from:{
        type:String,
        required: true
    },
    job:{
        type: String,
        require: true
    },
    createdAt:{
        type: Date, 
        default: Date.now
    },
    updatedAt:{
        type: Date, 
        default: Date.now
    }
});

var Profile = mongoose.model("Profile", profileSchema, "profiles");

module.exports = Profile;