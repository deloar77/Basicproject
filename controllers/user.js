const asyncHandler=require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendMail = require("../utils/sendEmail")

// generate token
const generateToken = (id) =>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"7d"});
}

// registeruser
const registerUser = asyncHandler(async(req,res)=>{
    const {name,email,password} = req.body;
    //validation

    if(!name || !email || !password){
        res.status(400);
        throw new Error ("Please fill in all required fields");
    }
    if(password.length<6){
        res.status(400);
        throw new Error ("password must be upto 6 character");
    }

    // check user email already exists
    const userExists = await User.findOne({email});


    if(userExists){
        res.status(400);
        throw new Error("the Email has already been registeres");
    }

    // create a new user
    const user = await User.create({
        name,email,password
    });

    // Generate token
    const token = generateToken(user._id);
    // send http-only cookie
    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires: new Date(Date.now()+7*1000*86400), // 7 day
        sameSite:"none",
        //secure:true
    });
    
    if(user){
        const{_id,name,email,photo,phone,bio} = user;
        res.status(201).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio,
            token
            

        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");


    }





});

//LoginUser

const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;

    // Validate request
    if(!email || !password){
        res.status(400);
        throw new Error("please add an email and password");
    }
    //check if user exists
    const user = await User.findOne({email});
    if(!user){
        res.status(400);
        throw new Error("user not found, please signup");
    }

    // user exists check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    // generate token
    const token = generateToken(user._id);
    // send http-only cookie
    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires: new Date(Date.now()+ 1000*86400),// 1 day
        sameSite:"none",
        //secure:true
    });

    if(user && passwordIsCorrect){
        const {_id,name,email,photo,phone,bio} = user;
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio,
            token
        });
    } else {
        res.status(400);
        throw new Error("invalid email or password");
    }

});

//logout
const logout = asyncHandler(async(req,res)=>{
    res.cookie("token", "",{
        path:"/",
        httpOnly:true,
        expires: new Date(0),
        sameSite:"none",
        //secure:true,
    });
    
    return res.status(200).json({message:"successfully logged out"});
});

//Get user data


const getUser = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(user){
        const {_id,name,email,photo,phone,bio} = user;
        res.status(200).json({
            _id,
            name,
            email,
            photo,
            phone,
            bio
        });
    } else {
        res.status(400);
        throw new Error("user not found");
    }

});


//Get login status

const loginStatus = asyncHandler(async(req,res)=>{
    const token = req.cookies.token;
    if(!token){
        return res.json(false);
    }

    //verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(verified){
        return res.json(true);
    }
    return res.json(false);


});

//update user
const updateUser = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(user){
        const {name,email,photo,phone,bio} = user;
        user.email=email;
        user.name = req.body.name || name;
        user.photo = req.body.photo || photo;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;

        const updatedUser = await user.save();
        res.status(200).json({
            _id:updatedUser._id,
            name:updateUser.name,
            email:updateUser.email,
            photo:updateUser.photo,
            phone:updateUser.phone,
        })
    } else {
        res.status(404);
        throw new Error("user not found");
    }
})

//change password
const changePassword = asyncHandler(async(req,res)=>{

    const user = await User.findById(req.user._id);
    const {oldPassword,password} = req.body;

    if(!user){
        res.status(400);
        throw new Error("user not found, please sign up");
    }

    // validate

    if(!oldPassword || !password){
        res.status(400);
        throw new Error("please add old and new password");
    }

    // check if oldpassword matches with password in db

    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // save new password
    if(user && passwordIsCorrect){
        user.password = password;
        await user.save();
        res.status(200).send("password change successfully");
    } else {
        res.status(400);
        throw new Error("old password is incorrect");
    }


})

//forgot password

const forgotPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    const user = await User.findOne({email});

    if(!user){
        res.status(404);
        throw new Error("user does not exists");
    }

    //deltete token if it exists in db

    let token = await Token.findOne(userId.user._id);
    if(token){
        await token.deleteOne();
    }

    //create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log("hi",resetToken)
    //res.send("forgot passwore")

    //hash token before saving to db

    const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    console.log("hello",hashedToken);

    // res.send("forgot password updated")

    //save token to database
    await new Token({
        userId:user._id,
        token:hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 *(60*1000),// thirty minutes

    }).save();

    // construct reset url

    const resetUrl = `&{process.env.FRONTEND_URL}/resetpassword/&{resetToken}`;

    //reset email
    const message = `
    <h2>hello ${user.name} </h2>
    <p>please use the url below to reset your password</p>
    <p>this reset link is valid only for 30 minutes</p>
    <a href=&{resetUrl} clicktracking = off> &{resetUrl} </a>
    <p> hi from here</p>
    <p>you are welcome</p>
    `;

    const subject = "password reset request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try{
        await sendMail(subject,message,send_to,sent_from);
        res.status(200).json({success:true,message:"reset email sent successfully"})
    } catch(error){
        res.status(500);
        throw new Error("email not send,please try again")
    }



});


module.exports={
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword
}