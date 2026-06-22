# D-Bank System Documentation

## Overview
D-Bank is a Decentralised Online Banking System that bridges traditional banking concepts with blockchain liquidity. It supports Ethereum smart contract-based banking and Solana-based token bridging (cNGN).

---

## 1. User Flow

### Phase 1: Onboarding & Identity
1.  **Registration**: User registers with email and password. If the email is already in use, the backend returns a `400 Email already registered` error.
2.  **Automatic Wallet Provisioning**: Upon successful registration, the backend automatically provisions a unique Ethereum and Solana wallet for the user (`ethPublicKey`, `solPublicKey`, `encryptedEthPrivateKey`, and `encryptedSolPrivateKey` stored in the database).
3.  **Authentication**: User logs in to receive a JWT for secure API access.

### Phase 2: Wallet Details Discovery
1.  **Retrieval**: To get their public keys (addresses) for Ethereum or Solana transactions, the frontend calls the GET `/wallet` endpoint (passing the user's JWT).
2.  **Use**: The frontend uses the returned `ethPublicKey` and `solPublicKey` to show balance details and generate transactions.

### Phase 3: Smart Contract Setup
1.  **Contract Registration**: Before using Ethereum banking features, the user must register their wallet on the `Account.sol` smart contract.
2.  **Process**:
    - Call `/transfer/eth/create-account` to get transaction data.
    - Sign the transaction (client-side/wallet).
    - Call `/transfer/eth/broadcast` to execute the registration.

### Phase 4: Funding & Liquidity (Omnichannel)
Users can fund their D-Bank account through multiple channels:
*   **Internal Deposit**: Direct credit via `/account/deposit` (Simulated traditional banking).
*   **Solana Deposit (cNGN)**:
    - User sends cNGN tokens to the system's designated wallet.
    - `BlockchainMonitor` detects the transaction.
    - `BridgeService` credits the user's internal bank balance.
*   **Ethereum Deposit**:
    - User calls `/transfer/eth/deposit` -> Signs -> Broadcasts.
    - Tokens are locked in the `Transfer.sol` contract.
    - `BlockchainMonitor` detects the event and synchronizes the internal bank balance.

### Phase 5: Banking Operations
*   **P2P Transfers (Ethereum)**: Move funds to another user's wallet via smart contract.
*   **Withdrawal (Bank to Solana)**: Call `/bridge/withdraw` to convert internal bank balance into cNGN tokens sent to the user's wallet.
*   **Withdrawal (Ethereum Smart Contract)**: Call `/transfer/eth/withdraw` to release locked funds back to the user's wallet.

### Phase 6: Session Termination
1.  **Logout**: The user logs out. The frontend triggers `POST /auth/logout` to clear secure HTTP-only cookies and removes any locally stored JWT tokens from client memory.

---

## 2. API Data Structures

### Authentication & Wallets
#### POST `/register`
*   **Request**: `{ "email": "user@example.com", "password": "password123" }`
*   **Response (201)**: `{ "message": "User registered successfully", "userId": "uuid" }`
*   **Response (400)**: `{ "error": "Email already registered" }`

#### POST `/login`
*   **Request**: `{ "email": "user@example.com", "password": "password123" }`
*   **Response (200)**: `{ "token": "jwt_token", "user": { "id": "uuid", "email": "..." } }`

#### POST `/logout`
*   **Response (200)**: `{ "success": true, "message": "Logged out successfully" }`

#### GET `/wallet`
*   **Auth**: Required (Bearer Token)
*   **Response (200)**: `{ "ethPublicKey": "0x...", "solPublicKey": "...", "publicKey": "..." }`

---

## 3. Deployment Configuration (Prisma / Supabase / Render)

### Database Connection Limitation
Supabase projects are **IPv6-only** by default for direct connections. Since Render operates on an **IPv4-only** outbound network, direct connections will time out with a `P1001` error.
*   **The Fix**: You must use the **Session Mode Connection Pooler** (port `5432` on `aws-0-eu-west-3.pooler.supabase.com`) which supports IPv4:
    ```text
    postgres://postgres.lmacjhtufvawzeaispvi:VsACEiiinIYuAKgN@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=require
    ```

### Build & Deploy Commands
To build the application on Render, ensure you run clean installs and compile Prisma schemas:
*   **Build Command**: `npm ci && npm run prisma:generate && npm run build && npx prisma migrate deploy`
*   **Start Command**: `npm run start`
