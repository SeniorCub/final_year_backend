import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response): Promise<void> => {
     try {
          const { name, email, password } = req.body;

          if (!email || !password) {
               res.status(400).json({ success: false, message: 'Please provide email and password' });
               return;
          }

          const userExists = await User.findOne({ email });
          if (userExists) {
               res.status(400).json({ success: false, message: 'User already exists' });
               return;
          }

          // Use provided name or default to the prefix of email
          const displayName = name || email.split('@')[0];

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          const user = await User.create({
               name: displayName,
               email,
               password: hashedPassword
          });

          res.status(201).json({
               message: 'User registered successfully',
               userId: user._id
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};

export const login = async (req: Request, res: Response): Promise<void> => {
     try {
          const { email, password } = req.body;

          if (!email || !password) {
               res.status(400).json({ success: false, message: 'Please provide email and password' });
               return;
          }

          const user = await User.findOne({ email }).select('+password');
          if (!user || !user.password) {
               res.status(401).json({ success: false, message: 'Invalid credentials' });
               return;
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
               res.status(401).json({ success: false, message: 'Invalid credentials' });
               return;
          }

          const token = jwt.sign(
               { userId: user._id, email: user.email },
               JWT_SECRET,
               { expiresIn: '24h' }
          );

          res.status(200).json({
               token,
               user: {
                    id: user._id,
                    email: user.email
               }
          });
     } catch (error: any) {
          res.status(500).json({ success: false, error: error.message });
     }
};
