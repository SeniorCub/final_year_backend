# D-Bank API Reference

This document provides a comprehensive guide to the D-Bank API, covering authentication, banking operations, and blockchain integration.

---

## 1. Authentication
Endpoints for user registration and session management.

### Register
*   **URL**: `/auth/register`
*   **Method**: `POST`
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword"
    }
    ```
*   **Response (201)**:
    ```json
    {
      "message": "User registered successfully",
      "userId": "uuid-string"
    }
    ```

### Login
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Response (200)**:
    ```json
    {
      "token": "jwt-token-string",
      "user": { "id": "uuid", "email": "..." }
    }
    ```

---

## 2. Internal Banking
Manage the simulated traditional bank account.

### Get Account
*   **URL**: `/account`
*   **Method**: `GET`
*   **Auth**: Required (Bearer Token)

### Deposit
*   **URL**: `/account/deposit`
*   **Method**: `POST`
*   **Request Body**: `{ "amount": number }`

---

## 3. Ethereum Smart Contract Integration
These endpoints generate raw transaction data for client-side signing and broadcasting.

### Create Account (Contract Registration)
*   **URL**: `/transfer/eth/create-account`
*   **Method**: `POST`

### Deposit to Contract
*   **URL**: `/transfer/eth/deposit`
*   **Method**: `POST`
*   **Request Body**: `{ "amount": "string" }`

### P2P Transfer
*   **URL**: `/transfer/eth/p2p`
*   **Method**: `POST`
*   **Request Body**: `{ "recipientAddress": "0x...", "amount": "string" }`

### Broadcast Transaction
*   **URL**: `/transfer/eth/broadcast`
*   **Method**: `POST`
*   **Request Body**: `{ "signedTx": "0x-hex-signed-transaction" }`

---

## 4. Solana Bridge (cNGN)
Move funds between the bank and the Solana blockchain.

### Get Bridge Config
*   **URL**: `/bridge/config`
*   **Method**: `GET`

### Withdraw to Solana
*   **URL**: `/bridge/withdraw`
*   **Method**: `POST`
*   **Request Body**: `{ "amount": number }`

---

## 5. Ledger & Audit
### Get Ledger
*   **URL**: `/ledger`
*   **Method**: `GET`
*   **Description**: Unified history of all transactions.

### Get Blockchain History
*   **URL**: `/ledger/blockchain`
*   **Method**: `GET`
*   **Description**: Fetches events directly from the Ethereum smart contract.
