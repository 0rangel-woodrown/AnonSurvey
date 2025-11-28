/**
 * FHE Utility Functions for AnonSurvey
 * Based on LuckyVault pattern - Clean, simple implementation
 *
 * Uses CDN-loaded RelayerSDK v0.3.0-5 (fhEVM v0.9.1)
 * Script tag in index.html:
 * <script src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs" defer crossorigin="anonymous"></script>
 */

import { bytesToHex, getAddress } from 'viem';
import type { Address } from 'viem';
import { CONTRACT_CONFIG } from '@/contracts/config';

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

let fheInstance: any = null;

/**
 * Get SDK from window (loaded via CDN)
 */
const getSDK = () => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error('Relayer SDK not loaded. Ensure the CDN script tag is present.');
  }
  return sdk;
};

/**
 * Initialize FHE instance
 * @param provider - Optional ethereum provider (defaults to window.ethereum)
 */
export const initializeFHE = async (provider?: any) => {
  if (fheInstance) return fheInstance;

  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires a browser environment');
  }

  const ethereumProvider =
    provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;

  if (!ethereumProvider) {
    throw new Error('No wallet provider detected. Connect a wallet first.');
  }

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;

  await initSDK();
  const config = { ...SepoliaConfig, network: ethereumProvider };
  fheInstance = await createInstance(config);

  console.log('[FHE] Instance initialized successfully');
  return fheInstance;
};

/**
 * Get FHE instance (lazy init if needed)
 */
const getInstance = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  return initializeFHE(provider);
};

/**
 * Get FHE instance without initialization
 */
export const getFheInstance = () => fheInstance;

/**
 * Reset FHE instance
 */
export const resetFheInstance = () => {
  fheInstance = null;
  console.log('[FHE] Instance reset');
};

/**
 * Encrypt a single answer (euint16)
 * @param value - Value to encrypt (0-65535)
 * @param userAddress - User's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptAnswer = async (
  value: number,
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  console.log('[FHE] Encrypting answer:', value);

  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add16(value); // euint16 for survey answers

  const { handles, inputProof } = await input.encrypt();

  if (handles.length < 1) {
    throw new Error('FHE SDK returned insufficient handles');
  }

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt multiple answers (batch)
 * @param answers - Array of answer values
 * @param userAddress - User's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptMultipleAnswers = async (
  answers: number[],
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{ handles: `0x${string}`[]; proof: `0x${string}` }> => {
  console.log(`[FHE] Encrypting ${answers.length} answers...`);

  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);

  for (const answer of answers) {
    input.add16(answer);
  }

  const { handles, inputProof } = await input.encrypt();

  if (handles.length < answers.length) {
    throw new Error('FHE SDK returned insufficient handles');
  }

  const hexHandles = handles.map((h: Uint8Array) => bytesToHex(h) as `0x${string}`);

  console.log(`[FHE] Encrypted ${answers.length} answers successfully`);

  return {
    handles: hexHandles,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt survey response data (all in one call for shared inputProof)
 * @param answers - Array of answer values (euint16)
 * @param qualityScore - Quality score (euint16)
 * @param completionTime - Completion time in seconds (euint8)
 * @param contractAddress - Contract address
 * @param userAddress - User's wallet address
 * @param provider - Optional ethereum provider
 */
export const encryptSurveyResponse = async (
  answers: number[],
  qualityScore: number,
  completionTime: number,
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{
  answerHandles: `0x${string}`[];
  qualityScoreHandle: `0x${string}`;
  completionTimeHandle: `0x${string}`;
  inputProof: `0x${string}`;
}> => {
  console.log(`[FHE] Encrypting survey response: ${answers.length} answers + quality score + completion time`);

  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);

  // Add all answers as euint16
  for (const answer of answers) {
    input.add16(answer);
  }

  // Add quality score as euint16
  input.add16(qualityScore);

  // Add completion time as euint8
  input.add8(completionTime);

  const { handles, inputProof } = await input.encrypt();

  // Total handles = answers.length + 1 (qualityScore) + 1 (completionTime)
  const expectedHandles = answers.length + 2;
  if (handles.length < expectedHandles) {
    throw new Error(`FHE SDK returned ${handles.length} handles, expected ${expectedHandles}`);
  }

  const hexHandles = handles.map((h: Uint8Array) => bytesToHex(h) as `0x${string}`);

  console.log(`[FHE] Encrypted survey response successfully`);

  return {
    answerHandles: hexHandles.slice(0, answers.length),
    qualityScoreHandle: hexHandles[answers.length],
    completionTimeHandle: hexHandles[answers.length + 1],
    inputProof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Encrypt quality score (euint16)
 */
export const encryptQualityScore = async (
  score: number,
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  return encryptAnswer(score, contractAddress, userAddress, provider);
};

/**
 * Encrypt completion time (euint8)
 */
export const encryptCompletionTime = async (
  time: number,
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  console.log('[FHE] Encrypting completion time:', time);

  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);
  input.add8(time); // euint8 for time (0-255)

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Generic encrypt function with configurable bit size
 * @param value - Value to encrypt
 * @param bitSize - Bit size: 8, 16, 32, 64, 128, 256
 */
export const encryptValue = async (
  value: number | bigint,
  bitSize: 8 | 16 | 32 | 64 | 128 | 256,
  contractAddress: string,
  userAddress: Address,
  provider?: any
): Promise<{ handle: `0x${string}`; proof: `0x${string}` }> => {
  const instance = await getInstance(provider);
  const contractAddr = getAddress(contractAddress);
  const userAddr = getAddress(userAddress);

  const input = instance.createEncryptedInput(contractAddr, userAddr);

  switch (bitSize) {
    case 8: input.add8(value); break;
    case 16: input.add16(value); break;
    case 32: input.add32(value); break;
    case 64: input.add64(value); break;
    case 128: input.add128(value); break;
    case 256: input.add256(value); break;
  }

  const { handles, inputProof } = await input.encrypt();

  return {
    handle: bytesToHex(handles[0]) as `0x${string}`,
    proof: bytesToHex(inputProof) as `0x${string}`,
  };
};

/**
 * Public decryption for handles marked as publicly decryptable
 * Returns SDK 0.3.0-5 format: { clearValues, abiEncodedClearValues, decryptionProof }
 */
export const publicDecrypt = async (
  handles: string[]
): Promise<{
  clearValues: Record<string, bigint>;
  abiEncodedClearValues: `0x${string}`;
  decryptionProof: `0x${string}`;
}> => {
  const instance = getFheInstance();
  if (!instance) throw new Error('FHE not initialized');

  console.log('[FHE] Requesting public decryption for', handles.length, 'handles...');

  const result = await instance.publicDecrypt(handles);

  return {
    clearValues: result.clearValues || {},
    abiEncodedClearValues: (result.abiEncodedClearValues || '0x') as `0x${string}`,
    decryptionProof: (result.decryptionProof || '0x') as `0x${string}`,
  };
};

/**
 * Decrypt single value
 */
export const decryptValue = async (
  contractAddress: string,
  handle: string
): Promise<number> => {
  const result = await publicDecrypt([handle]);
  const value = result.clearValues[handle];

  if (value === undefined) {
    throw new Error(`Failed to decrypt handle: ${handle}`);
  }

  return Number(value);
};

/**
 * Batch decrypt multiple values
 */
export const decryptMultipleValues = async (
  contractAddress: string,
  handles: string[]
): Promise<number[]> => {
  const result = await publicDecrypt(handles);

  return handles.map(handle => {
    const value = result.clearValues[handle];
    if (value === undefined) {
      throw new Error(`Failed to decrypt handle: ${handle}`);
    }
    return Number(value);
  });
};

/**
 * User decryption with EIP-712 signature
 */
export const userDecrypt = async (
  handles: string[],
  contractAddress: string,
  signer: any
): Promise<Record<string, number>> => {
  const instance = getFheInstance();
  if (!instance) throw new Error('FHE not initialized');

  console.log('[FHE] Using EIP-712 user decryption...');

  const keypair = instance.generateKeypair();
  const handleContractPairs = handles.map(handle => ({
    handle,
    contractAddress,
  }));

  const startTimeStamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10';
  const contractAddresses = [contractAddress];

  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimeStamp,
    durationDays
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    await signer.getAddress(),
    startTimeStamp,
    durationDays
  );

  const decryptedValues: Record<string, number> = {};
  for (const handle of handles) {
    decryptedValues[handle] = Number(result[handle]);
  }

  return decryptedValues;
};

// ============ Status & Utility Functions ============

/**
 * Check if FHE SDK is loaded (CDN script present)
 */
export const isFHEReady = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window.RelayerSDK || window.relayerSDK);
};

/**
 * Check if FHE instance is initialized
 */
export const isFheInitialized = (): boolean => {
  return fheInstance !== null;
};

/**
 * Alias for compatibility
 */
export const isRelayerSDKLoaded = isFHEReady;

/**
 * Wait for FHE SDK to be loaded (with timeout)
 */
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (isFHEReady()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
};

/**
 * Get FHE status for debugging
 */
export const getFHEStatus = (): {
  sdkLoaded: boolean;
  instanceReady: boolean;
} => {
  return {
    sdkLoaded: isFHEReady(),
    instanceReady: fheInstance !== null,
  };
};

/**
 * Get SDK version info
 */
export const getSdkVersion = (): string => {
  return 'RelayerSDK v0.3.0-5 (fhEVM v0.9.1) - CDN';
};
