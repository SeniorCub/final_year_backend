import prisma from '../database/prisma.js';
import { ledgerService } from '../ledger/ledger.service.js';
import { LedgerEntryType } from '@prisma/client';

export class AccountService {
     async createAccount(userId: string) {
          const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
          return await prisma.account.create({
               data: {
                    userId,
                    accountNumber,
                    balance: 0,
               },
          });
     }

     async getAccount(userId: string) {
          const account = await prisma.account.findUnique({
               where: { userId },
          });
          if (!account) throw new Error('Account not found');
          return account;
     }

     async deposit(userId: string, amount: number) {
          const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          return await prisma.$transaction(async (tx) => {
               const account = await tx.account.update({
                    where: { userId },
                    data: { balance: { increment: amount } },
               });

               await tx.ledgerEntry.create({
                    data: {
                         userId,
                         type: LedgerEntryType.DEPOSIT,
                         amount,
                         reference,
                         metadata: { method: 'simulation' },
                    },
               });

               return account;
          });
     }

     async withdraw(userId: string, amount: number) {
          const reference = `WTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          return await prisma.$transaction(async (tx) => {
               const account = await tx.account.findUnique({ where: { userId } });
               if (!account || account.balance.toNumber() < amount) {
                    throw new Error('Insufficient balance');
               }

               const updatedAccount = await tx.account.update({
                    where: { userId },
                    data: { balance: { decrement: amount } },
               });

               await tx.ledgerEntry.create({
                    data: {
                         userId,
                         type: LedgerEntryType.WITHDRAW,
                         amount,
                         reference,
                    },
               });

               return updatedAccount;
          });
     }

     async internalTransfer(senderId: string, receiverEmail: string, amount: number) {
          const reference = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          return await prisma.$transaction(async (tx) => {
               const senderAccount = await tx.account.findUnique({ where: { userId: senderId } });
               if (!senderAccount || senderAccount.balance.toNumber() < amount) {
                    throw new Error('Insufficient balance');
               }

               const receiver = await tx.user.findUnique({ where: { email: receiverEmail }, include: { account: true } });
               if (!receiver || !receiver.account) {
                    throw new Error('Receiver account not found');
               }

               // Deduct from sender
               await tx.account.update({
                    where: { userId: senderId },
                    data: { balance: { decrement: amount } },
               });

               // Credit receiver
               await tx.account.update({
                    where: { userId: receiver.id },
                    data: { balance: { increment: amount } },
               });

               // Create transaction record
               await tx.transaction.create({
                    data: {
                         senderId,
                         receiverId: receiver.id,
                         amount,
                    },
               });

               // Create ledger entries for both
               await tx.ledgerEntry.createMany({
                    data: [
                         {
                              userId: senderId,
                              type: LedgerEntryType.TRANSFER,
                              amount: -amount,
                              reference: `${reference}-S`,
                              metadata: { to: receiverEmail },
                         },
                         {
                              userId: receiver.id,
                              type: LedgerEntryType.TRANSFER,
                              amount,
                              reference: `${reference}-R`,
                              metadata: { from: senderId },
                         },
                    ],
               });

               return { success: true, reference };
          });
     }
}

export const accountService = new AccountService();
