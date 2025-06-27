// src/utils/solanaTransactions.js
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import ENV from '../config/environment.js';

// Usar TextEncoder/TextDecoder nativo del navegador
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Función para convertir Uint8Array a base64 sin Buffer
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Configuration from environment
const GAME_TOKEN_MINT = new PublicKey(ENV.GAME_TOKEN_MINT);
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Create connection with proper devnet endpoint
const connection = new Connection(ENV.SOLANA_RPC_URL, {
  commitment: 'confirmed',
  wsEndpoint: undefined // Disable websocket for better compatibility
});

if (ENV.DEBUG_MODE) {
  console.log('🔗 Solana connection created for:', ENV.SOLANA_RPC_URL);
}

/**
 * Derive associated token account address manually
 */
async function getAssociatedTokenAddress(mint, owner) {
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
  
  const [address] = await PublicKey.findProgramAddress(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  return address;
}

/**
 * Create burn instruction manually without @solana/spl-token
 */
function createBurnInstruction(account, mint, owner, amount) {
  // Burn instruction data layout:
  // [instruction_type: u8, amount: u64]
  const instructionData = new Uint8Array(9);
  instructionData[0] = 8; // Burn instruction type
  
  // Convert amount to little-endian u64
  const amountBuffer = new ArrayBuffer(8);
  const amountView = new DataView(amountBuffer);
  amountView.setBigUint64(0, BigInt(amount), true); // true = little endian
  instructionData.set(new Uint8Array(amountBuffer), 1);

  return new TransactionInstruction({
    keys: [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: instructionData,
  });
}

/**
 * Create a burn transaction for the participation fee
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount to burn (default: PARTICIPATION_FEE)
 * @returns {Promise<Transaction>} - Unsigned transaction
 */
export async function createBurnTransaction(userPublicKey, amount = ENV.PARTICIPATION_FEE) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get user's associated token account for the game token
    const userTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, userPubkey);

    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      userTokenAccount,    // account to burn from
      GAME_TOKEN_MINT,     // mint
      userPubkey,          // owner
      amount               // amount to burn
    );

    // Create transaction
    const transaction = new Transaction();
    transaction.add(burnInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    return transaction;
  } catch (error) {
    console.error('Error creating burn transaction:', error);
    throw new Error(`Failed to create burn transaction: ${error.message}`);
  }
}

/**
 * Sign and serialize a transaction using native browser APIs
 * @param {Transaction} transaction - The transaction to sign
 * @param {Function} signTransaction - Wallet's sign function
 * @returns {Promise<string>} - Base64 encoded signed transaction
 */
export async function signAndSerializeTransaction(transaction, signTransaction) {
  try {
    // Sign the transaction with the user's wallet
    const signedTransaction = await signTransaction(transaction);
    
    // Serialize to Uint8Array
    const serialized = signedTransaction.serialize();
    
    // Convert to base64 using native browser APIs
    return uint8ArrayToBase64(serialized);
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}

/**
 * Check if user has enough tokens to burn
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount needed
 * @returns {Promise<boolean>} - Whether user has enough tokens
 */
export async function checkTokenBalance(userPublicKey, amount = ENV.PARTICIPATION_FEE) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, userPubkey);

    // Get token account info
    const accountInfo = await connection.getTokenAccountBalance(userTokenAccount);
    
    if (!accountInfo.value) {
      return false;
    }

    const balance = accountInfo.value.uiAmount || 0;
    return balance >= amount;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
}

/**
 * Get user's current token balance
 * @param {string} userPublicKey - User's wallet public key
 * @returns {Promise<number>} - Current token balance
 */
export async function getTokenBalance(userPublicKey) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, userPubkey);

    // Get token account info
    const accountInfo = await connection.getTokenAccountBalance(userTokenAccount);
    
    return accountInfo.value?.uiAmount || 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}