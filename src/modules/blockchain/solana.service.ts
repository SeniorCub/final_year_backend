import {
     Connection,
     Keypair,
     PublicKey,
     Transaction,
     sendAndConfirmTransaction,
     LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
     getOrCreateAssociatedTokenAccount,
     createTransferCheckedInstruction,
     getMint,
     TOKEN_PROGRAM_ID,
     getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const CNGN_MINT = process.env.CNGN_TOKEN_ADDRESS;

export class SolanaService {
     private connection: Connection;

     constructor() {
          this.connection = new Connection(RPC_URL, 'confirmed');
     }

     async createWallet() {
          const keypair = Keypair.generate();
          return {
               publicKey: keypair.publicKey.toBase58(),
               privateKey: bs58.encode(keypair.secretKey),
          };
     }

     async getSOLBalance(publicKey: string): Promise<number> {
          const pubKey = new PublicKey(publicKey);
          const balance = await this.connection.getBalance(pubKey);
          return balance / LAMPORTS_PER_SOL;
     }

     async getTokenBalance(publicKey: string): Promise<number> {
          if (!CNGN_MINT) {
               throw new Error('CNGN_TOKEN_ADDRESS not configured');
          }

          try {
               let mintPubKey: PublicKey;
               let userPubKey: PublicKey;
               
               try {
                    mintPubKey = new PublicKey(CNGN_MINT);
                    userPubKey = new PublicKey(publicKey.trim());
               } catch (pubKeyErr: any) {
                    console.error('[SolanaService] Invalid public key:', pubKeyErr.message);
                    return 0; // Return 0 balance if invalid key is provided (e.g. non-base58)
               }

               const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(userPubKey, {
                    mint: mintPubKey,
               });

               if (tokenAccounts.value.length === 0) {
                    return 0;
               }

               const amountStr = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
               return parseFloat(amountStr) || 0;
          } catch (error: any) {
               console.error('Error fetching token balance:', error);
               return 0;
          }
     }

     async transferToken(
          fromSecretKey: string,
          toPublicKey: string,
          amount: number
     ): Promise<string> {
          if (!CNGN_MINT) {
               throw new Error('CNGN_TOKEN_ADDRESS not configured');
          }

          const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromSecretKey));
          const toPubKey = new PublicKey(toPublicKey);
          const mintPubKey = new PublicKey(CNGN_MINT);

          const mintInfo = await getMint(this.connection, mintPubKey);
          const decimals = mintInfo.decimals;

          // Get the token account of the fromWallet address, and if it does not exist, create it
          const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
               this.connection,
               fromKeypair,
               mintPubKey,
               fromKeypair.publicKey
          );

          // Get the token account of the toWallet address, and if it does not exist, create it
          const toTokenAccount = await getOrCreateAssociatedTokenAccount(
               this.connection,
               fromKeypair,
               mintPubKey,
               toPubKey
          );

          const tx = new Transaction().add(
               createTransferCheckedInstruction(
                    fromTokenAccount.address,
                    mintPubKey,
                    toTokenAccount.address,
                    fromKeypair.publicKey,
                    amount * Math.pow(10, decimals),
                    decimals
               )
          );

          const signature = await sendAndConfirmTransaction(this.connection, tx, [fromKeypair]);
          return signature;
     }

     async confirmTransaction(signature: string) {
          const latestBlockhash = await this.connection.getLatestBlockhash();
          await this.connection.confirmTransaction({
               signature,
               ...latestBlockhash,
          });
          return true;
     }
}

export const solanaService = new SolanaService();
