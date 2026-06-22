# D-Bank API Reference

This document provides a comprehensive guide to the D-Bank API, covering authentication, banking operations, blockchain integration, and Supabase integration.

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
*   **Error Response (400)** (If email is already registered):
    ```json
    {
      "error": "Email already registered"
    }
    ```

### Login
*   **URL**: `/auth/login`
*   **Method**: `POST`
*   **Response (200)**:
    ```json
    {
      "token": "jwt-token-string",
      "user": { "id": "uuid", "email": "user@example.com" }
    }
    ```

### Logout
*   **URL**: `/auth/logout`
*   **Method**: `POST`
*   **Response (200)**:
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```
*   **Note**: Sets the `Set-Cookie` header to expire the `token` cookie (if used) and invalidates client session tokens.

---

## 2. User Wallets
Exposes the cryptographic wallets automatically provisioned for users on signup.

### Get Wallet Information
Retrieve the user's Ethereum and Solana public keys/wallet addresses.
*   **URL**: `/wallet`
*   **Method**: `GET`
*   **Auth**: Required (Bearer Token)
*   **Response (200)**:
    ```json
    {
      "id": "wal-123456",
      "userId": "uuid-string",
      "ethPublicKey": "0x25374013...",
      "solPublicKey": "7nM1rre...",
      "publicKey": "7nM1rre...",
      "createdAt": "2026-06-22T15:23:19.000Z",
      "updatedAt": "2026-06-22T15:23:19.000Z"
    }
    ```

### Get Wallet Balances
Retrieve the current balances for Ethereum and Solana chains.
*   **URL**: `/wallet/balance`
*   **Method**: `GET`
*   **Auth**: Required (Bearer Token)
*   **Response (200)**:
    ```json
    {
      "ethPublicKey": "0x25374013...",
      "solPublicKey": "7nM1rre...",
      "eth": "1.25",
      "sol": "500.0"
    }
    ```

---

## 3. Internal Banking
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

## 4. Ethereum Smart Contract Integration
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

## 5. Solana Bridge (cNGN)
Move funds between the bank and the Solana blockchain.

### Get Bridge Config
*   **URL**: `/bridge/config`
*   **Method**: `GET`

### Withdraw to Solana
*   **URL**: `/bridge/withdraw`
*   **Method**: `POST`
*   **Request Body**: `{ "amount": number }`

---

## 6. Ledger & Audit

### Get Ledger
*   **URL**: `/ledger`
*   **Method**: `GET`
*   **Description**: Unified history of all transactions.

### Get Blockchain History
*   **URL**: `/ledger/blockchain`
*   **Method**: `GET`
*   **Description**: Fetches events directly from the Ethereum smart contract.

---

## 7. Supabase Integration
Endpoints leveraging `@supabase/server` to provide RLS-scoped database operations.

### Get User Profile (RLS Protected)
*   **URL**: `/supabase/profile`
*   **Method**: `GET`
*   **Auth**: Required (Supabase User JWT)
*   **Response (200)**: Returns user claims payload decoded from Supabase auth.

### Get Todos (RLS Scoped Client)
*   **URL**: `/supabase/todos`
*   **Method**: `GET`
*   **Auth**: Required (Supabase User JWT)
*   **Response (200)**: Returns user-scoped todos using the `ctx.supabase` RLS-scoped client.

### Admin Sync Webhook (Bypass RLS)
*   **URL**: `/supabase/admin-sync`
*   **Method**: `GET`
*   **Auth**: Required (Supabase Secret Service Key)
*   **Response (200)**: Bypasses RLS to query/sync administrative data using `ctx.supabaseAdmin`.
