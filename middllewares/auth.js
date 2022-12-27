const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");



const protect = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies.token;
        if(!token){
            res.status(401);
            throw new Error("Not authorised,please login");
        }
        // verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // Get user id from token
        const user = await User.findById(verified.id).select("password");
        if(!user){
            res.status(401);
            throw new Error("user not foung");
        }

        req.user = user;
        next();
    } catch(error) {
        res.status(401);
        throw new Error("Not authorised, please login");

    }



});

module.exports= protect;