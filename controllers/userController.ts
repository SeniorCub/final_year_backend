import type { Request, Response } from 'express';
import User from '../models/User.js';

// Get all users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
     try {
          const users = await User.find().select('-password');
          res.status(200).json({
               success: true,
               count: users.length,
               data: users
          });
     } catch (error: any) {
          res.status(500).json({
               success: false,
               error: error.message
          });
     }
};

// Get single user by ID
export const getUser = async (req: Request, res: Response): Promise<void> => {
     try {
          const user = await User.findById(req.params.id).select('-password');
          if (!user) {
               res.status(404).json({
                    success: false,
                    message: `User not found with id of ${req.params.id}`
               });
               return;
          }
          res.status(200).json({
               success: true,
               data: user
          });
     } catch (error: any) {
          res.status(500).json({
               success: false,
               error: error.message
          });
     }
};

// Update user details
export const updateUser = async (req: Request, res: Response): Promise<void> => {
     try {
          const { name, email } = req.body;

          // Find and update user
          const user = await User.findByIdAndUpdate(
               req.params.id,
               { name, email },
               { new: true, runValidators: true }
          ).select('-password');

          if (!user) {
               res.status(404).json({
                    success: false,
                    message: `User not found with id of ${req.params.id}`
               });
               return;
          }

          res.status(200).json({
               success: true,
               data: user
          });
     } catch (error: any) {
          res.status(500).json({
               success: false,
               error: error.message
          });
     }
};

// Get current user profile (Me)
export const getMe = async (req: any, res: Response): Promise<void> => {
     try {
          if (!req.user) {
               res.status(401).json({ success: false, message: 'Not authorized' });
               return;
          }
          const user = await User.findById(req.user.userId).select('-password');
          if (!user) {
               res.status(404).json({ success: false, message: 'User not found' });
               return;
          }
          res.status(200).json(user);
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
