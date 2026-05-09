import prisma from '../database/prisma.js';
import { LedgerEntryType, LedgerEntryStatus } from '@prisma/client';

export interface CreateLedgerEntryDto {
     userId: string;
     type: LedgerEntryType;
     amount: number;
     reference: string;
     status?: LedgerEntryStatus;
     metadata?: any;
}

export class LedgerService {
     async createEntry(data: CreateLedgerEntryDto) {
          return await prisma.ledgerEntry.create({
               data: {
                    userId: data.userId,
                    type: data.type,
                    amount: data.amount,
                    reference: data.reference,
                    status: data.status || LedgerEntryStatus.COMPLETED,
                    metadata: data.metadata || {},
               },
          });
     }

     async getEntries(userId?: string) {
          if (userId) {
               return await prisma.ledgerEntry.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
               });
          }
          return await prisma.ledgerEntry.findMany({
               orderBy: { createdAt: 'desc' },
          });
     }
}

export const ledgerService = new LedgerService();
