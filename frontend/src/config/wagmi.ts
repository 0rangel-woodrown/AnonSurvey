import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, sepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';

const projectId = (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || '';
export const hasProjectId = Boolean(projectId && projectId !== 'YOUR_PROJECT_ID');

// Always export a Wagmi config so the app can render without crashing
export const config = hasProjectId
  ? getDefaultConfig({
      appName: 'Zama FHE Survey',
      projectId,
      chains: [sepolia],
      ssr: false,
    })
  : createConfig({
      chains: [sepolia],
      transports: {
        [sepolia.id]: http('https://sepolia.drpc.org'),
      },
      ssr: false,
    });
