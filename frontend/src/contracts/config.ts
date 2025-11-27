// Hardcode contract address for production to avoid env variable issues
// Updated for fhEVM v0.9.1 deployment with fixed submitResponse
const CONTRACT_ADDRESS = '0x4d96337Eb48431380cCa65729B2c8261003ABAcD';

export const CONTRACT_CONFIG = {
  SURVEY_ADDRESS: CONTRACT_ADDRESS,
  CHAIN_ID: 11155111, // Sepolia
  NETWORK_NAME: 'sepolia',
} as const;

// Debug: Log the contract address
console.log('Final contract address:', CONTRACT_CONFIG.SURVEY_ADDRESS);
console.log('Environment variables:', {
  VITE_SURVEY_CONTRACT_ADDRESS: import.meta.env.VITE_SURVEY_CONTRACT_ADDRESS,
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  VITE_NETWORK_NAME: import.meta.env.VITE_NETWORK_NAME,
});

export const SURVEY_STATUS = {
  DRAFT: 0,
  ACTIVE: 1,
  PAUSED: 2,
  CLOSED: 3,
  FINALIZED: 4,
  DECRYPTED: 5,
} as const;

export const QUESTION_TYPE = {
  RATING: 0,
  YES_NO: 1,
  MULTI_CHOICE: 2,
  NUMERIC: 3,
  SENTIMENT: 4,
} as const;

export type SurveyStatus = typeof SURVEY_STATUS[keyof typeof SURVEY_STATUS];
export type QuestionType = typeof QUESTION_TYPE[keyof typeof QUESTION_TYPE];
