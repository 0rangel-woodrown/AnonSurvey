/**
 * FHE Utility Functions for AnonSurvey
 * Based on Zama FHE Complete Guide
 *
 * Reference: @FHE_COMPLETE_GUIDE_FULL_CN.md
 * - Section 7: FHE Frontend Initialization
 * - Section 8: Creating Encrypted Data
 * - Section 9: Decryption and Permission Management
 */

import { getAddress, hexlify } from 'ethers';

let fheInstance: any = null;

/**
 * Initialize FHE instance (Singleton pattern)
 *
 * ⚠️ Must use CDN 0.2.0 version, npm package doesn't work on Sepolia
 * Reference: Section 6.2 Why must use CDN 0.2.0
 */
export async function initializeFHE(): Promise<any> {
  // Return existing instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Instance already initialized');
    return fheInstance;
  }

  // Environment check
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found. Please install MetaMask.');
  }

  try {
    console.log('[FHE] Loading SDK from CDN 0.2.0...');

    // ✅ Correct approach: Load from CDN (Section 6.2)
    const sdk: any = await import(
      'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js'
    );

    const { initSDK, createInstance, SepoliaConfig } = sdk;

    // Initialize WASM module (Section 7.1 Step 3)
    console.log('[FHE] Initializing WASM...');
    await initSDK();

    // Create configuration (Section 7.1 Step 4)
    const config = {
      ...SepoliaConfig,  // ✅ Built-in Sepolia configuration
      network: window.ethereum
    };

    // Create instance
    console.log('[FHE] Creating instance...');
    fheInstance = await createInstance(config);

    console.log('[FHE] ✅ Instance initialized successfully');
    return fheInstance;

  } catch (error) {
    console.error('[FHE] ❌ Initialization failed:', error);
    throw new Error(`FHE initialization failed: ${error}`);
  }
}

/**
 * Get FHE instance (without initialization)
 */
export function getFheInstance(): any {
  return fheInstance;
}

/**
 * Reset FHE instance (for testing or network switching)
 */
export function resetFheInstance(): void {
  fheInstance = null;
  console.log('[FHE] Instance reset');
}

/**
 * Encrypt single uint16 value (for survey answers)
 *
 * Section 8.1: Basic encryption flow
 *
 * @param value - Value to encrypt (answer value, e.g., 0-5)
 * @param contractAddress - Target contract address (must be checksummed)
 * @param userAddress - User address
 * @returns { handle, proof } - Encrypted handle and zero-knowledge proof
 */
export async function encryptAnswer(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  // Get FHE instance
  let fhe = getFheInstance();
  if (!fhe) {
    fhe = await initializeFHE();
  }
  if (!fhe) throw new Error('Failed to initialize FHE instance');

  // ⚠️ Critical: Address must comply with EIP-55 checksum (Section 8.1)
  const contractAddressChecksum = getAddress(contractAddress);

  console.log('[FHE] Creating encrypted input...');

  // Create encrypted input
  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );

  // Add 16-bit integer (euint16 is enough for survey answers 0-65535)
  ciphertext.add16(value);

  console.log('[FHE] Encrypting value...');

  // Encrypt and generate zero-knowledge proof
  const { handles, inputProof } = await ciphertext.encrypt();

  // Convert to hexadecimal string
  const handle = hexlify(handles[0]);
  const proof = hexlify(inputProof);

  console.log('[FHE] ✅ Encryption successful');

  return { handle, proof };
}

/**
 * Batch encrypt multiple answers (for submitting surveys)
 *
 * Section 8.3: Batch encrypt multiple values
 *
 * @param answers - Array of answers
 * @param contractAddress - Contract address
 * @param userAddress - User address
 * @returns { handles, proof } - Array of encrypted handles and shared proof
 */
export async function encryptMultipleAnswers(
  answers: number[],
  contractAddress: string,
  userAddress: string
): Promise<{ handles: string[]; proof: string }> {
  const fhe = await initializeFHE();
  const contractAddressChecksum = getAddress(contractAddress);

  console.log('[FHE] Creating encrypted input for ' + answers.length + ' answers...');

  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );

  // Add multiple values (all values share one proof)
  for (const answer of answers) {
    ciphertext.add16(answer);
  }

  console.log('[FHE] Encrypting multiple values...');

  // Encrypt (all values share one proof)
  const { handles, inputProof } = await ciphertext.encrypt();

  // Convert all handles
  const hexHandles = handles.map((h: any) => hexlify(h));
  const proof = hexlify(inputProof);

  console.log('[FHE] ✅ Batch encryption successful');

  return { handles: hexHandles, proof };
}

/**
 * Encrypt quality score (euint16)
 * For Survey.sol's responseQualityScoreCipher
 */
export async function encryptQualityScore(
  score: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  return encryptAnswer(score, contractAddress, userAddress);
}

/**
 * Encrypt completion time (euint8)
 * For Survey.sol's completionTimeCipher
 */
export async function encryptCompletionTime(
  time: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  const fhe = await initializeFHE();
  const contractAddressChecksum = getAddress(contractAddress);

  const ciphertext = await fhe.createEncryptedInput(
    contractAddressChecksum,
    userAddress
  );

  // Use euint8 (0-255 range is enough)
  ciphertext.add8(time);

  const { handles, inputProof } = await ciphertext.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof)
  };
}

/**
 * Request decryption of an encrypted value
 *
 * Section 9.3: Client-side decryption flow - Method 1
 *
 * @param contractAddress - Contract address
 * @param handle - Handle of encrypted data (from event or view function)
 * @returns Decrypted value
 */
export async function decryptValue(
  contractAddress: string,
  handle: string
): Promise<number> {
  const fhe = getFheInstance();
  if (!fhe) throw new Error('FHE not initialized');

  try {
    console.log('[FHE] Requesting decryption...');

    // publicDecrypt will request decryption permission from contract, then decrypt
    const values = await fhe.publicDecrypt([handle]);
    const decryptedValue = Number(values[handle]);

    console.log('[FHE] ✅ Decryption successful');

    return decryptedValue;
  } catch (error: any) {
    console.error('[FHE] ❌ Decryption failed:', error);

    if (error?.message?.includes('Failed to fetch')) {
      throw new Error('Decryption service temporarily unavailable');
    }
    if (error?.message?.includes('not authorized')) {
      throw new Error('You do not have permission to decrypt this data');
    }
    throw error;
  }
}

/**
 * Batch decrypt multiple values
 *
 * @param contractAddress - Contract address
 * @param handles - Array of encrypted data handles
 * @returns Array of decrypted values
 */
export async function decryptMultipleValues(
  contractAddress: string,
  handles: string[]
): Promise<number[]> {
  const fhe = getFheInstance();
  if (!fhe) throw new Error('FHE not initialized');

  try {
    console.log('[FHE] Requesting decryption for ' + handles.length + ' values...');

    const values = await fhe.publicDecrypt(handles);
    const decryptedValues = handles.map(handle => Number(values[handle]));

    console.log('[FHE] ✅ Batch decryption successful');

    return decryptedValues;
  } catch (error: any) {
    console.error('[FHE] ❌ Batch decryption failed:', error);
    throw error;
  }
}

/**
 * Generate question ID (bytes32)
 * For contract's questionId
 */
export function generateQuestionId(questionText: string, index: number): string {
  // Use keccak256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(questionText + '-' + index);

  // Simple implementation: use combination of question text and index
  // In production, should use ethers.keccak256
  const hash = Array.from(data)
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '0x');

  // Pad to 32 bytes
  return hash.padEnd(66, '0');
}

/**
 * Check if FHE is initialized
 */
export function isFheInitialized(): boolean {
  return fheInstance !== null;
}
