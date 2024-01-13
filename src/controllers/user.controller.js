import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //makesure all fields are fill
  //make sure username and email is not repeted
  //check for image, makesure avatar is not empty
  //upload to cloudinary to images
  //creat user object - create entry in db
  //remove password and refresh token from response
  //chek for user creation
  //return response

  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email and username already existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const cretedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!cretedUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, cretedUser, "User Registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get login details from frontend
  //makesure fields are not empty
  //serach username based on provided
  // if username is there makesure password is correct

  const { username, email, password } = req.body;
  console.log("body: ", req.body);
  if (!(username || email)) {
    throw new ApiError(400, "username and email is required");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) throw new ApiError(400, "user does not existed");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, refreshToken, accessToken },
        "User logged In successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", options)
    .cookie("accesstoken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const newAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  // console.log("token: ", token);

  if (!token) throw new ApiError(404, "Invalid refresh Token");

  try {
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    // console.log("decodedToken: ", decodedToken);

    const user = await User.findById(decodedToken._id);

    // console.log("user: ", user);

    if (!user) {
      throw new ApiError(403, "Invalid Token");
    }

    if (token !== user?.refreshToken) {
      throw new ApiError(403, "refresh token is expired or used");
    }

    const options = { httpOnly: true, secure: true };

    const { accessToken, newrefreshToken } = generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token " || error?.message);
  }
});

export { registerUser, loginUser, logOutUser, newAccessToken };
