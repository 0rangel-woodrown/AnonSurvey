/**
 * FHE React Hook with AbortController pattern
 *
 * Reference: Section 9.2 Frontend FHE Hook Best Practices
 *
 * Solves:
 * - FHE instance invalidation on network switch
 * - Race conditions in async operations
 * - Memory leaks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeFHE, getFheInstance, resetFheInstance } from '../utils/fhe';

interface UseFHEResult {
  fhe: any;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  refresh: () => void;
}

/**
 * FHE Hook with proper cleanup and abort handling
 *
 * @param chainId - Current chain ID
 * @param enabled - Whether to enable (default true)
 * @returns FHE instance and status
 */
export function useFHE(
  chainId: number | undefined,
  enabled: boolean = true
): UseFHEResult {
  const [fhe, setFhe] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refresh function: cleanup and reinitialize
  const refresh = useCallback(() => {
    console.log('[useFHE] Refreshing FHE instance...');

    // 1. Abort previous async operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Reset instance
    resetFheInstance();

    // 3. Clear state
    setFhe(null);
    setError(null);
    setStatus('idle');
  }, []);

  useEffect(() => {
    // If not enabled or missing required params, stay idle
    if (!enabled || typeof window === 'undefined' || !window.ethereum) {
      setStatus('idle');
      return;
    }

    // Check if network is supported
    const supportedNetworks = [11155111, 31337]; // Sepolia, Hardhat
    if (chainId && !supportedNetworks.includes(chainId)) {
      setError(new Error(`Unsupported network: ${chainId}. Please switch to Sepolia.`));
      setStatus('error');
      return;
    }

    // Check if already initialized
    const existingInstance = getFheInstance();
    if (existingInstance) {
      console.log('[useFHE] Using existing FHE instance');
      setFhe(existingInstance);
      setStatus('ready');
      return;
    }

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');

    // Async initialization
    (async () => {
      try {
        console.log('[useFHE] Initializing FHE instance...');
        const newInstance = await initializeFHE();

        // ⚠️ Check if aborted (network switch, etc.)
        if (controller.signal.aborted) {
          console.log('[useFHE] Initialization aborted (network changed)');
          return;
        }

        setFhe(newInstance);
        setStatus('ready');
        setError(null);

        console.log('[useFHE] ✅ FHE instance ready');
      } catch (err) {
        // If aborted, don't update state
        if (controller.signal.aborted) {
          return;
        }

        console.error('[useFHE] ❌ Initialization error:', err);
        setError(err as Error);
        setStatus('error');
      }
    })();

    // Cleanup function: called on unmount or dependency change
    return () => {
      console.log('[useFHE] Cleanup: aborting ongoing initialization');
      controller.abort();
    };
  }, [chainId, enabled]);

  return {
    fhe,
    isInitialized: status === 'ready',
    isLoading: status === 'loading',
    error,
    status,
    refresh
  };
}

/**
 * Simplified Hook: only returns instance and loading state
 */
export function useSimpleFHE() {
  const [fhe, setFhe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Check if already initialized
      const existingInstance = getFheInstance();
      if (existingInstance) {
        setFhe(existingInstance);
        return;
      }

      setIsLoading(true);
      try {
        const instance = await initializeFHE();
        setFhe(instance);
      } catch (err: any) {
        setError(err.message);
        console.error('[useSimpleFHE] Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  return {
    fhe,
    isLoading,
    error
  };
}
