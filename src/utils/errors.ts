export class AppError extends Error {
     constructor(public message: string, public statusCode: number = 400) {
          super(message);
          this.name = 'AppError';
     }
}

export class InsufficientBalanceError extends AppError {
     constructor() {
          super('Insufficient balance', 400);
     }
}

export class WalletNotFoundError extends AppError {
     constructor() {
          super('Wallet not found', 404);
     }
}

export class BlockchainError extends AppError {
     constructor(message: string) {
          super(`Blockchain error: ${message}`, 500);
     }
}
