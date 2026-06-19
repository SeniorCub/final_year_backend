# D-Bank System Documentation

## Overview
D-Bank is a Decentralised Online Banking System that bridges traditional banking concepts with blockchain liquidity. It supports Ethereum smart contract-based banking and Solana-based token bridging (cNGN).

---

## 1. User Flow

### Phase 1: Onboarding & Identity
1.  **Registration**: User registers with email and password.
2.  **Automatic Wallet Provisioning**: The system automatically generates a unique blockchain wallet for the user.
3.  **Authentication**: User logs in to receive a JWT for secure API access.

### Phase 2: Smart Contract Setup
1.  **Contract Registration**: Before using Ethereum banking features, the user must register their wallet on the `Account.sol` smart contract.
2.  **Process**:
    - Call `/transfer/eth/create-account` to get transaction data.
    - Sign the transaction (client-side/wallet).
    - Call `/transfer/eth/broadcast` to execute the registration.

### Phase 3: Funding & Liquidity (Omnichannel)
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

### Phase 4: Banking Operations
*   **P2P Transfers (Ethereum)**: Move funds to another user's wallet via smart contract.
*   **Withdrawal (Bank to Solana)**: Call `/bridge/withdraw` to convert internal bank balance into cNGN tokens sent to the user's wallet.
*   **Withdrawal (Ethereum Smart Contract)**: Call `/transfer/eth/withdraw` to release locked funds back to the user's wallet.

### Phase 5: Monitoring & Auditing
*   **Internal Ledger**: A unified history of all internal, bridge, and smart contract activities.
*   **Blockchain History**: A transparent audit trail fetched directly from smart contract events.

---

## 2. API Data Structures

### Authentication (`/auth`)
#### POST `/register`
*   **Request**: `{ "email": "user@example.com", "password": "password123" }`
*   **Response (201)**: `{ "message": "User registered successfully", "userId": "uuid" }`

#### POST `/login`
*   **Request**: `{ "email": "user@example.com", "password": "password123" }`
*   **Response (200)**: `{ "token": "jwt_token", "user": { "id": "uuid", "email": "..." } }`

---

### Internal Banking (`/account`)
#### GET `/balance`
*   **Response**: `{ "balance": 1500.00 }`

#### POST `/deposit`
*   **Request**: `{ "amount": 500.00 }`
*   **Response**: `{ "message": "Deposit successful", "balance": 2000.00 }`

---

### Blockchain Operations (`/transfer/eth`)
#### POST `/eth/deposit` | `/eth/withdraw` | `/eth/create-account`
*   **Request**: `{ "amount": "100", "fromAddress": "0x..." }`
*   **Response**: Returns raw transaction data (to, data, value, gas, etc.) for client-side signing.

#### POST `/eth/broadcast`
*   **Request**: `{ "signedTx": "0x_hex_string" }`
*   **Response**: `{ "txHash": "0x...", "status": "confirmed", "message": "..." }`

---

### Bridge Operations (`/bridge`)
#### GET `/config`
*   **Response**: `{ "systemWalletAddress": "...", "tokenMintAddress": "...", "network": "Solana Devnet" }`

#### POST `/withdraw`
*   **Request**: `{ "amount": 250.00 }`
*   **Response**: `{ "success": true, "signature": "...", "reference": "BCW-..." }`

---

### History & Admin
#### GET `/ledger`
*   **Response**: Array of entries: `[{ "type": "DEPOSIT", "amount": 100, "status": "COMPLETED", "createdAt": "..." }]`

#### GET `/ledger/blockchain`
*   **Response**: Array of events parsed from the Ethereum blockchain.
