// src/utils/solanaTransactions.js
import { 
  Connection,
  PublicKey,
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token';

// Configuration - these should match your server
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const GAME_TOKEN_MINT = new PublicKey('PCYfGh9AECbJ8QHnRhMtR84h4GFmLLtRZm1HEELbonk');
const PARTICIPATION_FEE = 250; // tokens to burn

// Create connection
const connection = new Connection(SOLANA_RPC, 'confirmed');

/**
 * Create a burn transaction for the participation fee
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount to burn (default: PARTICIPATION_FEE)
 * @returns {Promise<Transaction>} - Unsigned transaction
 */
export async function createBurnTransaction(userPublicKey, amount = PARTICIPATION_FEE) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get user's associated token account for the game token
    const userTokenAccount = await getAssociatedTokenAddress(
      GAME_TOKEN_MINT,
      userPubkey
    );

    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      userTokenAccount,    // account to burn from
      GAME_TOKEN_MINT,     // mint
      userPubkey,          // owner
      amount,              // amount to burn
      [],                  // multisig (none)
      TOKEN_PROGRAM_ID
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
 * Sign and serialize a transaction
 * @param {Transaction} transaction - The transaction to sign
 * @param {Function} signTransaction - Wallet's sign function
 * @returns {Promise<string>} - Base64 encoded signed transaction
 */
export async function signAndSerializeTransaction(transaction, signTransaction) {
  try {
    // Sign the transaction with the user's wallet
    const signedTransaction = await signTransaction(transaction);
    
    // Serialize to base64
    const serialized = signedTransaction.serialize();
    return Buffer.from(serialized).toString('base64');
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
export async function checkTokenBalance(userPublicKey, amount = PARTICIPATION_FEE) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      GAME_TOKEN_MINT,
      userPubkey
    );

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
    const userTokenAccount = await getAssociatedTokenAddress(
      GAME_TOKEN_MINT,
      userPubkey
    );

    // Get token account info
    const accountInfo = await connection.getTokenAccountBalance(userTokenAccount);
    
    return accountInfo.value?.uiAmount || 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

export { PARTICIPATION_FEE, GAME_TOKEN_MINT };