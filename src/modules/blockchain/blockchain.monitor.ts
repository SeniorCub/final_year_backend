import { Connection, PublicKey } from '@solana/web3.js';
import { bridgeService } from '../bridge/bridge.service.js';
import { ethereumService } from './ethereum.service.js';
import dotenv from 'dotenv';

dotenv.config();

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const SYSTEM_WALLET_PUBLIC_KEY = process.env.SYSTEM_WALLET_PUBLIC_KEY;
const CNGN_MINT = process.env.CNGN_TOKEN_ADDRESS;

export class BlockchainMonitor {
     private solanaConnection: Connection;

     constructor() {
          this.solanaConnection = new Connection(SOLANA_RPC_URL, 'confirmed');
     }

     async startMonitoring() {
          console.log('Starting Blockchain Monitor...');

          // 1. Start Ethereum Monitoring
          this.startEthereumMonitoring();

          // 2. Start Solana Monitoring (Polling)
          this.pollForSolanaDeposits();
     }

     /**
      * Listen for Ethereum Smart Contract Events (Polling)
      */
     private async startEthereumMonitoring() {
          console.log('Starting Ethereum Event Monitoring (Polling)...');
          
          try {
               let lastBlock = await ethereumService.getCurrentBlock();

               setInterval(async () => {
                    try {
                         const currentBlock = await ethereumService.getCurrentBlock();
                         if (currentBlock <= lastBlock) return;

                         const fromBlock = lastBlock + 1;
                         const toBlock = currentBlock;

                         console.log(`Checking Ethereum blocks ${fromBlock} to ${toBlock}`);

                         const contract = ethereumService.getTransferContract();
                         
                         // 1. Check P2PTransfer
                         const p2pEvents = await contract.getPastEvents('P2PTransfer' as any, { fromBlock, toBlock });
                         for (const event of (p2pEvents as any[])) {
                              const { sender, recipient, amount } = event.returnValues;
                              await bridgeService.syncEthereumTransfer(sender, recipient, amount.toString(), event.transactionHash);
                         }

                         // 2. Check Deposits
                         const depositEvents = await contract.getPastEvents('Deposit' as any, { fromBlock, toBlock });
                         for (const event of (depositEvents as any[])) {
                              const { user, amount } = event.returnValues;
                              await bridgeService.syncEthereumAction('DEPOSIT', user, amount.toString(), event.transactionHash);
                         }

                         // 3. Check Withdrawals
                         const withdrawEvents = await contract.getPastEvents('Withdrawal' as any, { fromBlock, toBlock });
                         for (const event of (withdrawEvents as any[])) {
                              const { user, amount } = event.returnValues;
                              await bridgeService.syncEthereumAction('WITHDRAW', user, amount.toString(), event.transactionHash);
                         }

                         lastBlock = toBlock;
                    } catch (error) {
                         console.error('Error polling Ethereum events:', error);
                    }
               }, 15000); // Poll every 15 seconds
          } catch (error) {
               console.error('Failed to initialize Ethereum monitoring. Retrying in 30s...', error);
               setTimeout(() => this.startEthereumMonitoring(), 30000);
          }
     }

     /**
      * Poll for recent Solana transactions to detect deposits to system wallet
      */
     async pollForSolanaDeposits() {
          if (!SYSTEM_WALLET_PUBLIC_KEY || !CNGN_MINT) {
               console.warn('Solana monitoring disabled: SYSTEM_WALLET_PUBLIC_KEY or CNGN_TOKEN_ADDRESS not set.');
               return;
          }

          const systemPubKey = new PublicKey(SYSTEM_WALLET_PUBLIC_KEY);

          setInterval(async () => {
               try {
                    const signatures = await this.solanaConnection.getSignaturesForAddress(systemPubKey, { limit: 10 });

                    for (const sig of signatures) {
                         const tx = await this.solanaConnection.getParsedTransaction(sig.signature, {
                              maxSupportedTransactionVersion: 0
                         });

                         if (!tx || !tx.meta) continue;

                         const systemTokenAccount = tx.meta.postTokenBalances?.find(
                              (b) => b.mint === CNGN_MINT && b.owner === SYSTEM_WALLET_PUBLIC_KEY
                         );

                         if (systemTokenAccount && systemTokenAccount.uiTokenAmount) {
                              const preBalance = tx.meta.preTokenBalances?.find(
                                   (b) => b.mint === CNGN_MINT && b.owner === SYSTEM_WALLET_PUBLIC_KEY
                              )?.uiTokenAmount.uiAmount || 0;

                              const postBalance = systemTokenAccount.uiTokenAmount.uiAmount || 0;
                              const amount = postBalance - preBalance;

                              if (amount > 0) {
                                   const sourceWallet = tx.transaction.message.accountKeys[0].pubkey.toBase58();
                                   await bridgeService.depositToBank(sourceWallet, amount, sig.signature);
                              }
                         }
                    }
               } catch (error) {
                    console.error('Error polling for Solana deposits:', error);
               }
          }, 30000); // Poll every 30 seconds
     }
}

export const blockchainMonitor = new BlockchainMonitor();
