import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiRespons.js";
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}



const registerUser = asyncHandler(async ( req , res ) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {Phone ,storename, email, GSTNumber, password } = req.body
    // console.log("gst", GSTNumber, "pas" , password, "phone" , Phone, "email;" , email, "storename" , storename)


    if ([storename, email, password, Phone].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: { email }
    })

    if (existedUser) {
        throw new ApiError(409, "User with email already exists")
    }
    //console.log(req.files);

    if (!GSTNumber) {
        throw new ApiError(400, 'GST Number is required');
    }

    const GSTminLength = 15;
    const GSTmaxLength = 15;
  
    // Check if text meets the character limits
    if (GSTNumber.length < GSTminLength) {
      return res.status(400).json({ error: `gstnumber must be at least ${GSTminLength} characters.` });
    } else if (GSTNumber.length > GSTmaxLength) {
      return res.status(400).json({ error: `gstnumber must be at least ${GSTmaxLength} characters.` });
    }

    if (!Phone) {
        throw new ApiError(400, "phone number is required")
    }
      
        // Define minimum and maximum character limits
        const minLength = 10;
        const maxLength = 10;
      
        // Check if text meets the character limits
        if (Phone.length < minLength) {
          return res.status(400).json({ error: `Phone Number must be at least ${minLength} numbers.` });
        } else if (Phone.length > maxLength) {
          return res.status(400).json({ error: `Phone Number must be no more than ${maxLength} numbers.` });
        }
      
        // If the text is within the limits, proceed to the next middleware or route handler
   

    const user = await User.create({
        Phone,
        storename,
        email, 
        password,
        GSTNumber,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});


    const loginUser = asyncHandler(async (req, res) => {
        //collect data from mongoose req.body -> data
        //collect user or email from input
        //find the user
        //pssword check
        //access and refreash token
        //send cookie

        const {email , password} = req.body

        if (!email) {
            throw new ApiError(400, "email or password is required")
        }

        const user = await User.findOne({
            $or: {email}
        })

        if (!user) {
            throw new ApiError(404, "user dose not exist")            
        }

        const isPasswordValid = await user.isPasswordCorrect
        (password)

        if (!isPasswordValid) {
            throw new ApiError(401, "invalid password")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
                
            )
        )

    })

    const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )
        const options = {
            httpOnly: true,
            secure: true
        }

        return res 
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
    })


    const refreshAccessToken = asyncHandler(async(req, res)=> {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError (401,"unauthorized request")
        }

try {
            const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id)
            
            
            if (!user) {
                throw new ApiError (401,"invalid refresh token")
            }
    
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "refresh token is expired")
            }
    
            const options = {
                httpOnly: true,
                secure: true
            }
            
    
            const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("newRefreshToken", newRefreshToken, options)
            .json(
                200,
                {accessToken: accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
}
    })


    const changeCurrentPassword = asyncHandler(async(req, res)=>{
       
        const {newPassword, oldPassword} = req.body

        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
            throw new ApiError(400,"invalid old password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed succesfully"))
    })


const getCurrentUser = asyncHandler(async(req, res)=> {
    return res
    .status(200)
    .json( new ApiResponse(200, req.user, "current user fatched succesfully"))

})

const updateAccountDetails = asyncHandler(async(req, res)=> {
    const {fullName , email} = req.body

    if (!fullName || !email) {
        throw new ApiError (400, "All fields are Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"))
})

    
export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
 }