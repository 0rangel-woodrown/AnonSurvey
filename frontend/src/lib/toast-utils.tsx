/**
 * Transaction Toast Utilities for AnonSurvey
 * Based on LuckyVault pattern - Shows transaction status with explorer links
 */

import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

/**
 * Get explorer URL for a transaction
 */
export const getExplorerUrl = (hash: string): string => {
  return `${SEPOLIA_EXPLORER}/${hash}`;
};

/**
 * Show transaction pending toast with explorer link
 */
export const toastTxPending = (hash: `0x${string}`, message?: string) => {
  toast.loading(
    <div className="flex items-center gap-2">
      <span>{message || "Transaction submitted..."}</span>
      <a
        href={getExplorerUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: Infinity,
    }
  );
};

/**
 * Show transaction success toast with explorer link
 */
export const toastTxSuccess = (hash: `0x${string}`, message: string) => {
  toast.success(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">{message}</div>
      <a
        href={getExplorerUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View on Etherscan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: 5000,
    }
  );
};

/**
 * Show transaction error toast with explorer link (if hash available)
 */
export const toastTxError = (hash: `0x${string}` | undefined, error: Error | string) => {
  const message = typeof error === "string" ? error : error.message || "Transaction failed";

  toast.error(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">Transaction Failed</div>
      <div className="text-sm text-muted-foreground line-clamp-2">{message}</div>
      {hash && (
        <a
          href={getExplorerUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on Etherscan
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>,
    {
      id: hash || `error-${Date.now()}`,
      duration: 7000,
    }
  );
};

/**
 * Show user rejected transaction toast
 */
export const toastUserRejected = () => {
  toast.error("Transaction rejected by user", {
    duration: 3000,
  });
};

/**
 * Show transaction confirming toast (waiting for block confirmation)
 */
export const toastTxConfirming = (hash: `0x${string}`) => {
  toast.loading(
    <div className="flex items-center gap-2">
      <span>Waiting for confirmation...</span>
      <a
        href={getExplorerUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: Infinity,
    }
  );
};

/**
 * Dismiss toast for a specific transaction
 */
export const dismissTxToast = (hash: `0x${string}`) => {
  toast.dismiss(hash);
};

/**
 * Check if error is user rejection
 */
export const isUserRejectedError = (error: Error | any): boolean => {
  const message = error?.message || "";
  return (
    message.includes("User rejected") ||
    message.includes("user rejected") ||
    message.includes("User denied") ||
    message.includes("ACTION_REJECTED")
  );
};

/**
 * Handle transaction error with appropriate toast
 */
export const handleTxError = (hash: `0x${string}` | undefined, error: Error | any) => {
  if (isUserRejectedError(error)) {
    toastUserRejected();
    if (hash) dismissTxToast(hash);
  } else {
    toastTxError(hash, error);
  }
};

/**
 * Show FHE encryption in progress toast
 */
export const toastEncrypting = (id?: string) => {
  return toast.loading("Encrypting data with FHE...", {
    id: id || "fhe-encrypting",
    duration: Infinity,
  });
};

/**
 * Show FHE encryption complete toast
 */
export const toastEncryptionComplete = (id?: string) => {
  toast.success("Encryption complete", {
    id: id || "fhe-encrypting",
    duration: 2000,
  });
};

/**
 * Dismiss FHE encryption toast
 */
export const dismissEncryptingToast = (id?: string) => {
  toast.dismiss(id || "fhe-encrypting");
};
