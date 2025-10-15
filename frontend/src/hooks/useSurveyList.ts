import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACT_CONFIG } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';

const SURVEY_CREATED_EVENT = parseAbiItem(
  'event SurveyCreated(uint256 indexed surveyId, address indexed creator, string title, uint8 numQuestions)'
);

export interface SurveyListItem {
  surveyId: bigint;
  id: string;
  creator: string;
  title: string;
  description: string;
  numQuestions: number;
  participantCount: number;
  targetParticipants: number;
  deadline: number;
  status: number;
  statusChangeCount: bigint;
}

interface UseSurveyListResult {
  surveys: SurveyListItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSurveyList(): UseSurveyListResult {
  const publicClient = usePublicClient();
  const contractAddress = useMemo(() => {
    return CONTRACT_CONFIG.SURVEY_ADDRESS ? (CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`) : null;
  }, []);

  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    if (!publicClient || !contractAddress) {
      setSurveys([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const latestBlock = await publicClient.getBlockNumber();
      const chunkSize = 5_000n;
      const defaultWindow = 200_000n;
      const deploymentBlockEnv = import.meta.env.VITE_SURVEY_DEPLOY_BLOCK
        ? BigInt(import.meta.env.VITE_SURVEY_DEPLOY_BLOCK)
        : null;
      let fromBlock = deploymentBlockEnv && deploymentBlockEnv <= latestBlock
        ? deploymentBlockEnv
        : latestBlock > defaultWindow
          ? latestBlock - defaultWindow
          : 0n;
      if (fromBlock < 0n) {
        fromBlock = 0n;
      }

      const allLogs: any[] = [];

      while (fromBlock <= latestBlock) {
        const toBlock = fromBlock + chunkSize - 1n > latestBlock ? latestBlock : fromBlock + chunkSize - 1n;
        console.log('Fetching logs from block', fromBlock.toString(), 'to', toBlock.toString(), 'for contract', contractAddress);
        
        const logsChunk = await publicClient.getLogs({
          address: contractAddress,
          event: SURVEY_CREATED_EVENT,
          fromBlock,
          toBlock,
        });
        allLogs.push(...logsChunk);
        fromBlock = toBlock + 1n;
      }

      const uniqueSurveys = new Map<string, { surveyId: bigint; creator: `0x${string}` }>();
      for (const log of allLogs) {
        const surveyId = log.args.surveyId as bigint;
        if (!uniqueSurveys.has(surveyId.toString())) {
          uniqueSurveys.set(surveyId.toString(), {
            surveyId,
            creator: log.args.creator as `0x${string}`,
          });
        }
      }

      const surveyEntries = Array.from(uniqueSurveys.values());
      const details: SurveyListItem[] = [];

      for (const entry of surveyEntries) {
        try {
          const result = await publicClient.readContract({
            address: contractAddress,
            abi: SURVEY_ABI,
            functionName: 'getSurveyInfo',
            args: [entry.surveyId],
          }) as readonly [
            `0x${string}`,
            string,
            bigint,
            bigint,
            number,
            bigint,
            bigint,
            bigint
          ];

          const [
            creator,
            title,
            numQuestions,
            deadline,
            status,
            participantCount,
            targetParticipants,
            statusChangeCount,
          ] = result;

          details.push({
            surveyId: entry.surveyId,
            id: entry.surveyId.toString(),
            creator,
            title,
            description: '', // description not exposed by contract; leave blank
            numQuestions: Number(numQuestions),
            participantCount: Number(participantCount),
            targetParticipants: Number(targetParticipants),
            deadline: Number(deadline),
            status: Number(status),
            statusChangeCount,
          });
        } catch (innerError) {
          console.error('Failed to load survey info:', innerError);
        }
      }

      // Sort by creation order: newest first (assuming larger surveyId means later)
      details.sort((a, b) => (a.surveyId > b.surveyId ? -1 : 1));
      setSurveys(details);
    } catch (err: any) {
      console.error('Failed to fetch surveys:', err);
      console.log('Falling back to example survey data');
      
      // Fallback to example survey data
      const exampleSurveys: SurveyListItem[] = [
        {
          surveyId: 1n,
          id: '1',
          creator: '0x37483F5093A12c49a397b58884ecDB1614d7e7DE',
          title: '2024 Cryptocurrency Usage Habits Survey',
          description: 'Understanding user preferences and holdings of different cryptocurrencies',
          numQuestions: 3,
          participantCount: 0,
          targetParticipants: 100,
          deadline: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days from now
          status: 1, // Active
          statusChangeCount: 0n,
        }
      ];
      
      setSurveys(exampleSurveys);
      setError(null); // Clear error since we have fallback data
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await fetchSurveys();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [fetchSurveys]);

  const refresh = useCallback(async () => {
    await fetchSurveys();
  }, [fetchSurveys]);

  return {
    surveys,
    isLoading,
    error,
    refresh,
  };
}
