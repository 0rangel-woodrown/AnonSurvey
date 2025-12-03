# AnonSurvey

**Privacy-Preserving Survey Platform with Fully Homomorphic Encryption**

A decentralized survey system that ensures complete respondent anonymity through Zama's fhEVM technology. Survey responses are encrypted client-side and remain encrypted on-chain, enabling statistical computations without ever exposing individual answers.

## Live Demo

- **Application**: [anonsurvey-fhe.vercel.app](https://anonsurvey-fhe.vercel.app)
- **Contract**: [`0x4d96337Eb48431380cCa65729B2c8261003ABAcD`](https://sepolia.etherscan.io/address/0x4d96337Eb48431380cCa65729B2c8261003ABAcD) (Sepolia)

https://github.com/user-attachments/assets/vote_demo.mp4

## Technical Architecture

### FHE Integration (Zama fhEVM v0.9.1)

The system leverages Fully Homomorphic Encryption to perform computations on encrypted data:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  FHE Client  │────▶│   Blockchain    │
│  (Plaintext)│     │ (Encryption) │     │  (Ciphertext)   │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                  │
                           Homomorphic Operations │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Results   │◀────│   Gateway    │◀────│  Encrypted Sum  │
│ (Decrypted) │     │ (Decryption) │     │   & Statistics  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Encrypted Types Used:**
- `euint16` - Individual survey responses (answers 1-10, yes/no, etc.)
- `euint32` - Aggregated statistics (sum, sum of squares, variance)
- `externalEuint16/8` - External encrypted inputs with proof verification

**Key FHE Operations:**
```solidity
// Lazy initialization on first response
stats.totalScoreCipher = FHE.asEuint32(answer);
stats.sumOfSquaresCipher = FHE.mul(FHE.asEuint32(answer), FHE.asEuint32(answer));

// Homomorphic aggregation for subsequent responses
stats.totalScoreCipher = FHE.add(stats.totalScoreCipher, FHE.asEuint32(answer));
stats.minResponseCipher = FHE.min(stats.minResponseCipher, answer);
stats.maxResponseCipher = FHE.max(stats.maxResponseCipher, answer);
```

### Smart Contract Design

**Survey Lifecycle:**
```
DRAFT → ACTIVE → PAUSED ↔ ACTIVE → CLOSED → FINALIZED → DECRYPTED
         ↓                    ↓
    (responses)          (deadline)
```

**Response Submission Flow:**
1. Client encrypts answers using `fhevmjs` library
2. Encrypted handles + input proof sent to contract
3. Contract validates via `FHE.fromExternal(handle, inputProof)`
4. Homomorphic operations update aggregate statistics
5. Individual responses never stored or reconstructable

### Privacy Guarantees

| Property | Mechanism |
|----------|-----------|
| Response Privacy | Client-side FHE encryption before submission |
| Unlinkability | Only aggregate stats stored, no individual mapping |
| Computation Privacy | All statistics computed on encrypted values |
| Result Integrity | Gateway decryption with proof verification |

## Project Structure

```
AnonSurvey/
├── contracts/
│   └── Survey.sol              # Core FHE survey contract (26KB)
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useFHE.ts       # FHE client initialization
│   │   │   └── useSurveyContract.ts
│   │   ├── utils/
│   │   │   └── fhe.ts          # Encryption utilities
│   │   └── pages/
│   │       ├── Surveys.tsx     # Survey listing
│   │       └── TakeSurvey.tsx  # Response submission
│   └── package.json
├── scripts/
│   └── deploy-simple.js        # Deployment + survey creation
└── hardhat.config.ts
```

## Development

### Prerequisites

- Node.js 18+
- MetaMask with Sepolia ETH

### Setup

```bash
# Install dependencies
npm install
cd frontend && npm install

# Configure environment
cp .env.example .env
# Add PRIVATE_KEY and SEPOLIA_RPC_URL

# Compile contracts
npx hardhat compile

# Deploy (includes 4 test surveys)
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" node scripts/deploy-simple.js

# Run frontend
cd frontend && npm run dev
```

### Contract Deployment

The deploy script handles:
1. Contract deployment with manual gas price (10 gwei) to avoid low RPC estimates
2. Creation of 4 demo surveys with varying question types
3. Survey activation for immediate use

## Question Types

| Type | Value Range | Use Case |
|------|-------------|----------|
| RATING | 1-10 | Satisfaction scores |
| YES_NO | 0-1 | Binary choices |
| MULTI_CHOICE | 1-N | Feature preferences |
| NUMERIC | Custom | Age, quantity inputs |
| SENTIMENT | 1-5 | Opinion scales |

## Security Considerations

- **No Individual Storage**: Responses contribute to aggregates only
- **Single Submission**: `hasSubmitted` mapping prevents double-voting
- **Access Control**: Owner, SurveyManager, DataAnalyst roles
- **Deadline Enforcement**: Responses rejected after survey closes

## Stack

- **Blockchain**: Ethereum Sepolia + Zama fhEVM v0.9.1
- **Smart Contracts**: Solidity 0.8.24, Hardhat
- **Frontend**: React 18, TypeScript, Vite
- **Web3**: wagmi, viem, RainbowKit
- **Styling**: Tailwind CSS, shadcn/ui

## License

MIT
