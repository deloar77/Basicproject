const mongoose = require("mongoose");
const {ObjectId} = mongoose.Schema.Types;


const tokenSchema = mongoose.Schema({
    userId :{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"user",
    },
    token:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        required:true,
    },
    expiresAT:{
        type:Date,
        required:true,
    }
});

const Token = mongoose.model("Token",tokenSchema);
module.exports=Token;