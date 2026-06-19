# Final Year Project: Decentralized Online Banking (Backend)

This repository contains the **backend services** for a modern, blockchain-integrated banking platform. It serves as the high-performance bridge between the traditional client interface (Cyter) and the decentralized ledger (Ethereum Smart Contracts).

## 🏗️ Project Architecture

``` bash
backend/
├── config/            # Database connection and environment setup
├── controllers/       # Business logic and request handlers
├── middleware/        # Authentication, validation, and error handling
├── models/            # Mongoose schemas (User, Account, etc.)
├── routes/            # API route definitions
├── services/          # Core logic for banking operations
└── server.ts          # Application entry point (Fastify/Express)
```

## 🚀 Key Features

*   **User Management**: Secure registration, login, and profile management.
*   **Blockchain Integration**: Connects to Ethereum (Sepolia) via **Web3.js**.
*   **Banking Operations**:
    *   **Wallets**: Create and manage crypto wallets.
    *   **Transfers**: Peer-to-peer (P2P) token transfers.
    *   **Bridge**: Deposit/Withdrawal functions for interacting with smart contracts.
*   **Real-time Notifications**: **Socket.IO** for live updates on transaction status.
*   **Scalability**:
    *   **Fastify** framework for high-performance routing.
    *   **Redis/BullMQ** for background job processing and queue management.
*   **Data Layer**:
    *   **PostgreSQL** database for off-chain data.
    *   **Prisma** ORM for type-safe database interactions.

## 🔧 Setup & Installation

### Prerequisites
*   Node.js (v14+ recommended)
*   PostgreSQL (Local or Remote)
*   Redis (Local or Remote)
*   npm or yarn

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Database Configuration
Create a `.env` file in the `backend/` directory with the following variables:
```bash
# Server Port
PORT=9001
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/bank_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=1d

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Ethereum (Smart Contract)
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
ETH_PRIVATE_KEY=your_private_key
ETH_DBANK_CONTRACT_ADDRESS=0x...
ETH_ACCOUNT_CONTRACT_ADDRESS=0x...
```

### 3. Database Migration
Run the Prisma migrations to create the necessary tables:
```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database
Run the seed script to create initial data (e.g., admin user):
```bash
npx tsx prisma/seed.ts
```

### 5. Start the Server
```bash
npm run dev
# or
yarn dev
```

The server will start on `http://localhost:9001`.

## 📋 API Endpoints

The following API endpoints are available (prefixed with `/api` or no prefix):

### 🔐 Auth
*   `POST /auth/register` - Register a new user.
*   `POST /auth/login` - Login and get JWT token.
*   `POST /auth/logout` - Logout user.
*   `POST /auth/refresh` - Refresh access token.

### 👤 Users
*   `GET /users` - Get all users (Admin).
*   `GET /users/:id` - Get user by ID.
*   `GET /user/me` - Get current user profile.
*   `PUT /users/:id` - Update user details.

### 💼 Wallet
*   `GET /wallet/private-key` - Get wallet (Admin only).
*   `POST /wallet/generate-random` - Generate random wallet (Admin only).
*   `POST /wallet/generate-linked` - Generate wallet linked to user.
*   `DELETE /wallet/delete-linked` - Delete linked wallet (Admin only).

### 🏦 Account
*   `POST /account/create` - Create account.
*   `GET /account/list` - List accounts.
*   `GET /account/:walletAddress` - Get account by wallet address.

### 💸 Transfer
*   `POST /transfer/deposit` - Deposit funds.
*   `POST /transfer/withdraw` - Withdraw funds.
*   `POST /transfer/p2p` - Send P2P transfer.
*   `GET /transfer/transaction` - Get transaction history.
*   `GET /transfer/history/:walletAddress` - Get user's transaction history.

### 🌉 Bridge
*   `POST /bridge/deposit-eth` - Deposit ETH to contract.
*   `POST /bridge/withdraw-eth` - Withdraw ETH from contract.
*   `POST /bridge/deposit-cgn` - Deposit CNGN to contract.
*   `POST /bridge/withdraw-cgn` - Withdraw CNGN from contract.
*   `POST /bridge/mint` - Mint CNGN tokens (Admin).
*   `POST /bridge/burn` - Burn CNGN tokens.

### 📊 Ledger
*   `GET /ledger/balance/:walletAddress` - Get wallet balance.
*   `GET /ledger/cgn-balance/:walletAddress` - Get CNGN token balance.
*   `GET /ledger/supply` - Get total token supply.

### 👥 Admin
*   `GET /admin/users` - Get all users.
*   `DELETE /admin/users/:id` - Delete a user.
*   `PUT /admin/users/:id/role` - Update user role.

## 🧩 Smart Contracts

The frontend interacts with Ethereum smart contracts deployed on the **Sepolia Testnet**:

1.  **`Account.sol`**: Manages account registration and state.
2.  **`Transfer.sol`**: Handles business logic for deposits, withdrawals, and P2P transfers.

## 🛠️ Development Commands

*   **Run Development Server**: `npm run dev`
*   **Build for Production**: `npm run build`
*   **Start Production Server**: `npm run start`
*   **Run Tests**: `npm run test` (if available)
*   **Database Migrate**: `npx prisma migrate dev`
*   **Seed Database**: `npx tsx prisma/seed.ts`
