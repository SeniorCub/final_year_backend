import prisma from '../database/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { walletService } from '../wallet/wallet.service.js';
import { accountService } from '../account/account.service.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthService {
     async register(email: string, password: string, fullName: string, phone: string, username: string) {
          const existingUser = await prisma.user.findFirst({
               where: {
                    OR: [
                         { email },
                         { username }
                    ]
               }
          });
          if (existingUser) {
               throw new Error(existingUser.email === email ? 'Email already registered' : 'Username already taken');
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await prisma.$transaction(async (tx) => {
               // 1. Create User
               const user = await tx.user.create({
                    data: {
                         email,
                         password: hashedPassword,
                         fullName,
                         phone,
                         username,
                    },
               });

               // 2. Create Bank Account
               const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
               await tx.account.create({
                    data: {
                         userId: user.id,
                         accountNumber,
                    },
               });
               
               return user;
          });

          // 3. Create Ethereum Wallet
          await walletService.createWallet(user.id);
          
          return user;
     }

     async login(email: string, password: string) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) throw new Error('Invalid credentials');

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) throw new Error('Invalid credentials');

          const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
               expiresIn: '24h',
          });

          return { user: { id: user.id, email: user.email }, token };
     }
}

export const authService = new AuthService();
