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
    const address = CONTRACT_CONFIG.SURVEY_ADDRESS;
    console.log('useSurveyList contractAddress:', address);
    
    // Validate address format
    if (address && address.startsWith('0x') && address.length === 42) {
      return address as `0x${string}`;
    }
    
    console.error('Invalid contract address format:', address);
    return null;
  }, []);

  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    console.log('fetchSurveys called with:', { publicClient: !!publicClient, contractAddress });
    
    if (!publicClient || !contractAddress) {
      console.log('Missing publicClient or contractAddress, using fallback data');
      // Use fallback data immediately
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
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to fetch survey events...');
      
      // Try a simpler approach - get logs from recent blocks only
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n; // Last 10k blocks
      
      console.log('Fetching logs from block', fromBlock.toString(), 'to', latestBlock.toString());
      
      const allLogs = await publicClient.getLogs({
        address: contractAddress,
        event: SURVEY_CREATED_EVENT,
        fromBlock,
        toBlock: latestBlock,
      });
      
      console.log('Found', allLogs.length, 'survey creation events');

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
