const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = mongoose.Schema({
name:{
    type:String,
    required:[true,"please add a name"]
},
password:{
    type:String,
    required:[true,"please enter a valid email"],
    minLength:[6,"password must be upto 6 character"]
},
email:{
    type:String,
    required:[true,"please add an email"],
    unique:true,
    trim:true,
    match:[/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
"please enter a valid email"]
},
photo:{
    type:String,
    required:[true,"please add a photo"],
    default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQR6wJQ4FlBhzjTEwUw6zn77QSnoydnWToPcTnE4jK8w&s"
},
phone:{
    type:String,
    default:"+880"
},
bio:{
    type:String,
    maxLength:[250,"the bio must not be more then 250"],
    default:"bio",
}


},{timestamps:true,versionKey:false});

// encrypt password before saving to db
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password,salt);
    this.password= hashedPassword;
    next();
});

const User = mongoose.model("User",userSchema);
module.exports= User;