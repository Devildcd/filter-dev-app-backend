import asyncHandler from 'express-async-handler';
import { loginUser, registerUser, logoutUser } from '../services/auth.service.js';
import { refreshAccessToken } from '../services/token.service.js'
import { sendResponse } from '../utils/apiResponse.js';

export const register = asyncHandler(async (req, res) => {
    const { name, email, phone, password, passwordConfirmed, role } = req.body;
  
    const userData = await registerUser(name, email, phone, password, passwordConfirmed, role);
  
   sendResponse(res, 200, "User registered successfully", userData);
  });

  export const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    // const accessToken = await loginUser(email, password, res);
    const user = await loginUser(email, password, res);

    res.status(200).json({message: 'Logged in', user});
  });

  export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const newAccessToken = await refreshAccessToken(refreshToken);
    res.json({ accessToken: newAccessToken });
  });

  export const logout = asyncHandler(async (req, res) => {
    if (!req.user) {
      console.log("No authenticated user found.");
      return res.status(401).json({ message: "No user authenticated." });
    }
    await logoutUser(res, req.user);
    res.json({ message: "Logged out" });
  });