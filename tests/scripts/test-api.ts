import axios from 'axios';

const API_URL = 'http://localhost:5901';

async function testFlow() {
     console.log('--- Starting System Test ---');

     const testEmail = `test-${Date.now()}@example.com`;
     const testPassword = 'password123';

     try {
          // 1. Register
          console.log('Step 1: Registering user...');
          const regRes = await axios.post(`${API_URL}/auth/register`, {
               email: testEmail,
               password: testPassword
          });
          console.log('User Registered:', regRes.data);

          // 2. Login
          console.log('Step 2: Logging in...');
          const loginRes = await axios.post(`${API_URL}/auth/login`, {
               email: testEmail,
               password: testPassword
          });
          const token = loginRes.data.token;
          const authHeaders = { Authorization: `Bearer ${token}` };
          console.log('Logged in, token received');

          // 3. Check Account
          console.log('Step 3: Checking account...');
          const accRes = await axios.get(`${API_URL}/account`, { headers: authHeaders });
          console.log('Account Details:', accRes.data);

          // 4. Deposit
          console.log('Step 4: Depositing simulation...');
          const depRes = await axios.post(`${API_URL}/account/deposit`, { amount: 1000 }, { headers: authHeaders });
          console.log('Deposit success, new balance:', depRes.data.balance);

          // 5. Check Wallet
          console.log('Step 5: Checking Solana wallet...');
          const walletRes = await axios.get(`${API_URL}/wallet`, { headers: authHeaders });
          console.log('Solana Wallet:', walletRes.data.publicKey);

          // 6. Withdraw to Blockchain
          console.log('Step 6: Withdrawing to blockchain (this might fail if system wallet is not funded)...');
          try {
               const withdrawRes = await axios.post(`${API_URL}/bridge/withdraw`, { amount: 100 }, { headers: authHeaders });
               console.log('Withdraw success:', withdrawRes.data);
          } catch (e: any) {
               console.warn('Withdrawal failed as expected (needs funded system wallet):', e.response?.data || e.message);
          }

          console.log('--- Test Finished ---');
     } catch (error: any) {
          console.error('Test failed:', error.response?.data || error.message);
     }
}

testFlow();
console.log('Run this script with: npx tsx tests/scripts/test-api.ts (Ensure server is running)');
