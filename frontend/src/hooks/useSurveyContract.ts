import {
  useWriteContract,
  useReadContract,
  useWatchContractEvent,
} from 'wagmi';
import { SURVEY_ABI } from '../contracts/SurveyABI';
import { CONTRACT_CONFIG } from '../contracts/config';
import { useToast } from './use-toast';

export function useSurveyContract() {
  const { toast } = useToast();
  const {
    writeContract,
    writeContractAsync,
    isPending: isWriting,
    data: txHash,
    isSuccess,
  } = useWriteContract();
  const contractAddress = CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`;

  // Simplified Create Survey (matches SurveySimple.sol)
  const createSurvey = async (
    title: string,
    description: string,
    category: number, // SurveyCategory enum (0-6)
    incentiveType: number, // IncentiveType enum (0-5)
    duration: bigint, // Duration in seconds
    targetResponses: bigint,
    requireVerification: boolean
  ): Promise<{ surveyId?: number; txHash?: string }> => {
    try {
      const result = await writeContractAsync({
        address: contractAddress,
        abi: SURVEY_ABI,
        functionName: 'createSurvey',
        args: [
          title,
          description,
          category,
          incentiveType,
          duration,
          targetResponses,
          requireVerification,
        ],
      });

      return { txHash: result };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create survey',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Add Question
  const addQuestion = async (
    surveyId: bigint,
    questionId: string,
    qType: number,
    minValue: number,
    maxValue: number,
    questionText: string
  ) => {
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: SURVEY_ABI,
        functionName: 'addQuestion',
        args: [surveyId, questionId as `0x${string}`, qType, minValue, maxValue, questionText],
      });

      toast({
        title: 'Question Added',
        description: 'Question has been added to the survey.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add question',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Activate Survey
  const activateSurvey = async (surveyId: bigint) => {
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: SURVEY_ABI,
        functionName: 'activateSurvey',
        args: [surveyId],
      });

      toast({
        title: 'Survey Activated',
        description: 'Survey is now active and accepting responses.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate survey',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Close Survey
  const closeSurvey = async (surveyId: bigint) => {
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: SURVEY_ABI,
        functionName: 'closeSurvey',
        args: [surveyId],
      });

      toast({
        title: 'Survey Closed',
        description: 'Survey has been closed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close survey',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    createSurvey,
    addQuestion,
    activateSurvey,
    closeSurvey,
    isWriting,
    writeContract,
    writeContractAsync,
  };
}

// Hook to read survey info
export function useSurveyInfo(surveyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: 'getSurveyInfo',
    args: surveyId !== undefined ? [surveyId] : undefined,
    query: {
      enabled: surveyId !== undefined && CONTRACT_CONFIG.SURVEY_ADDRESS !== '',
    },
  });

  return {
    surveyInfo: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook to watch survey events
export function useWatchSurveyEvents(
  eventName: 'SurveyCreated' | 'ResponseSubmitted' | 'SurveyClosed',
  onEvent: (log: any) => void
) {
  useWatchContractEvent({
    address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
    abi: SURVEY_ABI,
    eventName,
    onLogs: onEvent,
  });
}

export interface ContractQuestion {
  questionId: `0x${string}`;
  qType: number;
  maxValue: number;
  minValue: number;
  questionText: string;
}

export function useSurveyQuestions(surveyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: 'getSurveyQuestions',
    args: surveyId !== undefined ? [surveyId] : undefined,
    query: {
      enabled: surveyId !== undefined && CONTRACT_CONFIG.SURVEY_ADDRESS !== '',
    },
  });

  const questions: ContractQuestion[] = Array.isArray(data)
    ? data.map((q: any) => ({
        questionId: q.questionId as `0x${string}`,
        qType: Number(q.qType ?? 0),
        maxValue: Number(q.maxValue ?? 0),
        minValue: Number(q.minValue ?? 0),
        questionText: q.questionText ?? '',
      }))
    : [];

  return {
    questions,
    isLoading,
    error,
    refetch,
  };
}
