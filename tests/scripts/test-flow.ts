import axios from 'axios';
import { Web3 } from 'web3';

/**
 * D-Bank Full Flow Test Script
 * This script simulates a real user flow:
 * 1. Register/Login
 * 2. Get Transaction Data from Backend
 * 3. Sign Transaction Locally (Simulating MetaMask)
 * 4. Broadcast via Backend
 */

const API_URL = 'http://localhost:5901';
const ETH_RPC = 'http://127.0.0.1:8545';
const web3 = new Web3(ETH_RPC);

// Hardhat's Account #0 (The "Bank"/Faucet for our tests)
const FAUCET_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const FAUCET_ACCOUNT = web3.eth.accounts.privateKeyToAccount(FAUCET_KEY);

async function signAndBroadcast(token: string, txData: any, privateKey: string) {
    const signedTx = await web3.eth.accounts.signTransaction(txData, privateKey);
    const res = await axios.post(`${API_URL}/transfer/eth/broadcast`, {
        signedTx: signedTx.rawTransaction
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

async function runTest() {
    console.log('🚀 Starting D-Bank Automated Test (Fresh Wallet)...');

    try {
        // 1. Generate a COMPLETELY NEW wallet for this test
        const TEST_ACCOUNT = web3.eth.accounts.create();
        const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat account #1

        console.log(`Step 1: Funding new wallet ${TEST_ACCOUNT.address}...`);
        
        const gasPrice = await web3.eth.getGasPrice();
        
        // Fund the new wallet with 1 ETH from the faucet
        const fundTx = await web3.eth.accounts.signTransaction({
            from: FAUCET_ACCOUNT.address,
            to: TEST_ACCOUNT.address,
            value: web3.utils.toWei('1', 'ether'),
            gas: '21000',
            gasPrice: gasPrice.toString(),
        }, FAUCET_KEY);
        await web3.eth.sendSignedTransaction(fundTx.rawTransaction as string);
        console.log('✅ Wallet Funded with 1 ETH!');

        // 2. Auth
        const email = `user-${Date.now()}@dbank.com`;
        await axios.post(`${API_URL}/auth/register`, { email, password: 'password123' });
        const { data: { token } } = await axios.post(`${API_URL}/auth/login`, { email, password: 'password123' });
        console.log('✅ Step 2: User Registered & Logged In');

        // 3. Create On-Chain Account
        console.log('Step 3: Creating On-Chain Account...');
        const createTxData = (await axios.post(`${API_URL}/transfer/eth/create-account`, { fromAddress: TEST_ACCOUNT.address }, {
            headers: { Authorization: `Bearer ${token}` }
        })).data;
        const createResult = await signAndBroadcast(token, createTxData, TEST_ACCOUNT.privateKey);
        console.log(`✅ Step 3: Account Created (Hash: ${createResult.txHash.slice(0, 15)}...)`);

        // 4. Deposit
        console.log('Step 4: Depositing 5000 Units...');
        const depositTxData = (await axios.post(`${API_URL}/transfer/eth/deposit`, { 
            amount: "5000", 
            fromAddress: TEST_ACCOUNT.address 
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })).data;
        const depositResult = await signAndBroadcast(token, depositTxData, TEST_ACCOUNT.privateKey);
        console.log(`✅ Step 4: Deposit Broadcasted (Hash: ${depositResult.txHash.slice(0, 15)}...)`);

        // 5. P2P Transfer
        console.log('Step 5: Transferring 1500 Units...');
        const p2pTxData = (await axios.post(`${API_URL}/transfer/eth/p2p`, { 
            recipientAddress: RECIPIENT, 
            amount: "1500",
            fromAddress: TEST_ACCOUNT.address 
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })).data;
        const p2pResult = await signAndBroadcast(token, p2pTxData, TEST_ACCOUNT.privateKey);
        console.log(`✅ Step 5: P2P Transfer Broadcasted (Hash: ${p2pResult.txHash.slice(0, 15)}...)`);

        console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
        console.log('--------------------------------------------------');
        console.log(`Email: ${email}`);
        console.log(`Wallet: ${TEST_ACCOUNT.address}`);
        console.log('Check your backend console for synchronization logs.');
        console.log('--------------------------------------------------');

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
        if (error.stack) console.debug(error.stack);
    }
}

runTest();
