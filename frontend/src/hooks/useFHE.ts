/**
 * FHE React Hook - Simplified pattern based on LuckyVault
 *
 * Features:
 * - Wait for CDN SDK to load
 * - Lazy initialization on wallet connect
 * - Clean status tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeFHE,
  getFheInstance,
  resetFheInstance,
  isFHEReady,
  waitForFHE,
  getFHEStatus,
} from '../utils/fhe';

interface UseFHEResult {
  fhe: any;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  status: 'idle' | 'waiting' | 'loading' | 'ready' | 'error';
  refresh: () => void;
}

/**
 * FHE Hook with proper cleanup
 *
 * @param chainId - Current chain ID
 * @param enabled - Whether to enable (default true)
 * @returns FHE instance and status
 */
export function useFHE(
  chainId: number | undefined,
  enabled: boolean = true
): UseFHEResult {
  const [fhe, setFhe] = useState<any>(() => getFheInstance());
  const [status, setStatus] = useState<'idle' | 'waiting' | 'loading' | 'ready' | 'error'>(
    () => (getFheInstance() ? 'ready' : 'idle')
  );
  const [error, setError] = useState<Error | null>(null);
  const initializingRef = useRef(false);

  // Refresh function
  const refresh = useCallback(() => {
    console.log('[useFHE] Refreshing...');
    resetFheInstance();
    setFhe(null);
    setError(null);
    setStatus('idle');
    initializingRef.current = false;
  }, []);

  useEffect(() => {
    // Skip if not enabled or already initializing
    if (!enabled || initializingRef.current) {
      return;
    }

    // Check if already ready
    const existingInstance = getFheInstance();
    if (existingInstance) {
      if (fhe !== existingInstance) {
        setFhe(existingInstance);
        setStatus('ready');
      }
      return;
    }

    // Check browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Check supported networks
    const supportedNetworks = [11155111, 31337]; // Sepolia, Hardhat
    if (chainId && !supportedNetworks.includes(chainId)) {
      setError(new Error(`Unsupported network: ${chainId}. Please switch to Sepolia.`));
      setStatus('error');
      return;
    }

    // Check wallet
    if (!window.ethereum) {
      setStatus('idle');
      return;
    }

    // Start initialization
    initializingRef.current = true;
    let cancelled = false;

    const init = async () => {
      try {
        // Wait for SDK to load from CDN
        if (!isFHEReady()) {
          setStatus('waiting');
          console.log('[useFHE] Waiting for SDK to load from CDN...');
          const loaded = await waitForFHE(15000);
          if (!loaded) {
            throw new Error('FHE SDK failed to load from CDN');
          }
        }

        if (cancelled) return;

        // Initialize instance
        setStatus('loading');
        console.log('[useFHE] Initializing FHE instance...');
        const instance = await initializeFHE();

        if (cancelled) return;

        setFhe(instance);
        setStatus('ready');
        setError(null);
        console.log('[useFHE] Ready');

      } catch (err) {
        if (cancelled) return;
        console.error('[useFHE] Error:', err);
        setError(err as Error);
        setStatus('error');
      } finally {
        initializingRef.current = false;
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [chainId, enabled, fhe]);

  return {
    fhe,
    isInitialized: status === 'ready',
    isLoading: status === 'loading' || status === 'waiting',
    error,
    status,
    refresh,
  };
}

/**
 * Simplified Hook - only instance and loading state
 */
export function useSimpleFHE() {
  const [fhe, setFhe] = useState<any>(() => getFheInstance());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if already have instance
    if (getFheInstance()) {
      setFhe(getFheInstance());
      return;
    }

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        // Wait for SDK
        if (!isFHEReady()) {
          await waitForFHE(10000);
        }

        if (cancelled) return;

        const instance = await initializeFHE();
        if (!cancelled) {
          setFhe(instance);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return { fhe, isLoading, error };
}

/**
 * Hook to check FHE SDK status
 */
export function useFHEStatus() {
  const [status, setStatus] = useState(() => getFHEStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getFHEStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
