import asyncHandler from 'express-async-handler';
import { loginUser, registerUser, logoutUser } from '../services/auth.service.js';
import { refreshAccessToken } from '../services/token.service.js'

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, passwordConfirmed, role } = req.body;
  
    const user = await registerUser(name, email, password, passwordConfirmed, role);
  
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        access_code: user.access_code,
      },
    });
  });

  export const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    const accessToken = await loginUser(email, password, res);

    res.status(200).json({message: 'Logged in', accessToken});
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