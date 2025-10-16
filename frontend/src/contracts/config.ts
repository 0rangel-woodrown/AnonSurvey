export const CONTRACT_CONFIG = {
  SURVEY_ADDRESS: import.meta.env.VITE_SURVEY_CONTRACT_ADDRESS || '0x1f90CeE3a8Fab6b2CAe39D25cA4DaaF684836e1B',
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  NETWORK_NAME: import.meta.env.VITE_NETWORK_NAME || 'sepolia',
} as const;

// Debug: Log the contract address
console.log('Contract address:', CONTRACT_CONFIG.SURVEY_ADDRESS);
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
