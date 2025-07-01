// src/utils/solanaTransactions.js
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import ENV from '../config/environment.js';

// Import SystemProgram for SOL transfers
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Token Program IDs
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// Improved error handling for Solana transactions
class SolanaTransactionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'SolanaTransactionError';
    this.code = code;
    this.details = details;
  }
}

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

// Create connection with proper devnet endpoint
const connection = new Connection(ENV.SOLANA_RPC_URL, {
  commitment: 'confirmed',
  wsEndpoint: undefined // Disable websocket for better compatibility
});

if (ENV.DEBUG_MODE) {
  console.log(`🔗 Solana connection created for: ${ENV.SOLANA_RPC_URL}`);
}

/**
 * Derive associated token account address manually
 */
async function getAssociatedTokenAddress(mint, owner) {
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
 * Create a SOL transfer transaction for ship purchase
 * @param {string} userPublicKey - User's wallet public key
 * @param {string} recipientPublicKey - Recipient's wallet public key (game treasury)
 * @param {number} amount - Amount of SOL to transfer
 * @returns {Promise<Transaction>} - Unsigned transaction
 */
export async function createSolTransferTransaction(userPublicKey, recipientPublicKey, amount = ENV.SHIP_PRICE_SOL) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    const recipientPubkey = new PublicKey(recipientPublicKey || "BRTreasurywNz13QfBRKmZvEZ3oKZ4BPZ4CpNHpKJjaf");
    
    // Create a simple SOL transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: userPubkey,
      toPubkey: recipientPubkey,
      lamports: amount * LAMPORTS_PER_SOL
    });

    // Create transaction
    const transaction = new Transaction();
    transaction.add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    return transaction;
  } catch (error) {
    console.error('Error creating SOL transfer transaction:', error);
    throw new Error(`Failed to create transfer transaction: ${error.message}`);
  }
}

/**
 * Create a token transfer transaction for ship purchase with BR tokens
 * @param {string} userPublicKey - User's wallet public key
 * @param {string} recipientTokenAccount - Recipient's token account address
 * @param {number} amount - Amount of tokens to transfer
 * @returns {Promise<Transaction>} - Unsigned transaction
 */
export async function createTokenTransferTransaction(userPublicKey, recipientTokenAccount, amount) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    const recipientAta = new PublicKey(recipientTokenAccount);
    
    // Get user's associated token account for the game token
    const userTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, userPubkey);
    
    if (ENV.DEBUG_MODE) {
      console.log('🔍 Token transfer details:', {
        from: userTokenAccount.toString(),
        to: recipientAta.toString(),
        amount: amount
      });
    }
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      userTokenAccount,       // source
      recipientAta,           // destination (already an ATA)
      userPubkey,             // owner
      amount                  // amount
    );

    // Create transaction
    const transaction = new Transaction();
    transaction.add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    return transaction;
  } catch (error) {
    console.error('Error creating token transfer transaction:', error);
    throw new Error(`Failed to create token transfer transaction: ${error.message}`);
  }
}

/**
 * Create transfer instruction manually without @solana/spl-token
 */
function createTransferInstruction(source, destination, owner, amount) {
  // Transfer instruction data layout:
  // [instruction_type: u8, amount: u64]
  const instructionData = new Uint8Array(9);
  instructionData[0] = 3; // Transfer instruction type
  
  // Convert amount to little-endian u64
  const amountBuffer = new ArrayBuffer(8);
  const amountView = new DataView(amountBuffer);
  amountView.setBigUint64(0, BigInt(amount), true); // true = little endian
  instructionData.set(new Uint8Array(amountBuffer), 1);

  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data: instructionData,
  });
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
    
    // Handle user rejection specifically
    if (error.message?.includes('User rejected') || 
        error.message?.includes('rejected') ||
        error.message?.includes('cancelled') ||
        error.message?.includes('denied') ||
        error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    
    // Handle other wallet errors
    if (error.message?.includes('Insufficient funds')) {
      throw new Error('Insufficient SOL for transaction fees');
    }
    
    
    // Handle user rejection specifically
    if (error.message?.includes('User rejected') || 
        error.message?.includes('rejected') ||
        error.message?.includes('cancelled') ||
        error.message?.includes('denied') ||
        error.code === 4001) {
      throw new Error('Transaction cancelled by user');
    }
    
    // Handle other wallet errors
    if (error.message?.includes('Insufficient funds')) {
      throw new Error('Insufficient SOL for transaction fees');
    }
    
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}

/**
 * Check if user has enough SOL for purchase
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount needed in SOL
 * @returns {Promise<boolean>} - Whether user has enough SOL
 */
export async function checkSolBalance(userPublicKey, amount = ENV.SHIP_PRICE_SOL) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get SOL balance
    const balance = await connection.getBalance(userPubkey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    // Add buffer for transaction fees (0.000005 SOL)
    return solBalance >= (amount + 0.000005);
  } catch (error) {
    console.error('Error checking SOL balance:', error);
    return false;
  }
}

/**
 * Check if user has enough tokens to burn
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount needed
 * @returns {Promise<boolean>} - Whether user has enough tokens
 */
export async function checkTokenBalance(userPublicKey, amount = ENV.PARTICIPATION_FEE) {
  // For development/testing, always return true
  if (ENV.DEBUG_MODE && ENV.MOCK_API) {
    return true;
  }

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
 * Get user's current SOL balance
 * @param {string} userPublicKey - User's wallet public key
 * @returns {Promise<number>} - Current SOL balance
 */
export async function getSolBalance(userPublicKey) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // Get SOL balance
    const balance = await connection.getBalance(userPubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    return 0;
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

    // For development/testing, return mock balance if no real connection
    if (ENV.DEBUG_MODE && ENV.MOCK_API) {
      return Math.floor(Math.random() * 10000);
    }
    
    // Get user's associated token account
    try {
      const userTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, userPubkey);

      // Get token account info
      const accountInfo = await connection.getTokenAccountBalance(userTokenAccount);
      
      return accountInfo.value?.uiAmount || 0;
    } catch (error) {
      // If token account doesn't exist, return 0
      if (error.message?.includes('account not found')) {
        return 0;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting token balance:', error.message);
    
    // Provide more user-friendly error
    if (error.message?.includes('account not found')) {
      return 0; // No token account means 0 balance
    }
    
    if (error.message?.includes('connect')) {
      throw new SolanaTransactionError(
        'Unable to connect to Solana network. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }
    
    // Default fallback
    return 0;
  }
}

/**
 * Get transaction history for a wallet
 * @param {string} userPublicKey - User's wallet public key
 * @returns {Promise<Array>} - Transaction history
 */
export async function getTransactionHistory(userPublicKey) {
  try {
    const userPubkey = new PublicKey(userPublicKey);
    
    // For development/testing, return mock transactions
    if (ENV.DEBUG_MODE) {
      return [
        { signature: 'mock1', blockTime: Date.now()/1000 - 3600, type: 'CLAIM', amount: 1000 },
        { signature: 'mock2', blockTime: Date.now()/1000 - 7200, type: 'MISSION', amount: 500 },
        { signature: 'mock3', blockTime: Date.now()/1000 - 86400, type: 'RAID', amount: 1500 }
      ];
    }
    
    // Get recent transactions
    const transactions = await connection.getSignaturesForAddress(
      userPubkey,
      { limit: 10 }
    );
    
    // Process and return transaction details
    return transactions.map(tx => ({
      signature: tx.signature,
      blockTime: tx.blockTime,
      type: 'UNKNOWN', // Would need to parse transaction data to determine type
      amount: 0 // Would need to parse transaction data to determine amount
    }));
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
}

/**
 * Withdraw tokens from game to wallet
 * @param {string} userPublicKey - User's wallet public key
 * @param {number} amount - Amount to withdraw
 * @returns {Promise<Object>} - Transaction result
 */
export async function withdrawTokens(userPublicKey, amount) {
  try {
    // This is now handled by the Node.js server
    // The server will mint tokens to the user's wallet
    throw new Error('Use apiService.withdrawTokens() instead');
  } catch (error) {
    console.error('Error withdrawing tokens:', error);
    throw new Error(`Failed to withdraw tokens: ${error.message}`);
  }
}