# AnonSurvey 🔐

A fully anonymous on-chain survey system powered by Zama's Fully Homomorphic Encryption (FHE) technology. Create surveys, collect encrypted responses, and perform statistical analysis while maintaining complete privacy.

## 🌟 Key Features

- **🔐 Complete Anonymity**: User responses are fully encrypted and untraceable
- **📊 Homomorphic Statistics**: Real-time computation of scores and averages on encrypted data
- **🔓 Asynchronous Decryption**: Use Gateway for post-deadline statistical result decryption
- **🚫 Anti-Cheating**: One submission per address only
- **⭐ Multiple Question Types**: Rating, Yes/No, Multiple Choice, Numeric, Sentiment Analysis
- **📈 Advanced Statistics**: Mean, variance, min/max calculations
- **🌐 Web3 Integration**: Seamless wallet connection with RainbowKit

## 🏗️ Architecture

### Smart Contract Layer
- **Survey.sol**: Main contract handling survey lifecycle and FHE operations
- **FHE Integration**: Zama fhEVM for homomorphic encryption operations
- **Gateway Integration**: Asynchronous decryption for statistical results

### Frontend Layer
- **React 18 + TypeScript**: Modern web application framework
- **Wagmi + RainbowKit**: Web3 wallet integration
- **shadcn/ui + Tailwind CSS**: Beautiful, responsive UI components
- **FHE Client**: Client-side encryption using Zama's FHE library

### Data Flow
```
User Input → FHE Encryption → Blockchain Storage → Homomorphic Computation → Gateway Decryption → Statistical Results
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn
- MetaMask or other Web3 wallet
- Sepolia testnet ETH for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/0rangel-woodrown/AnonSurvey.git
cd AnonSurvey

# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Configuration

1. **Environment Setup**:
```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

2. **Configure `.env`** (root directory):
```env
SEPOLIA_RPC_URL=https://sepolia.drpc.org
PRIVATE_KEY=your-private-key-here
GITHUB_PAT=your-github-pat-here
ETHERSCAN_API_KEY=your-etherscan-api-key
```

3. **Configure `frontend/.env.local`**:
```env
VITE_SURVEY_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=sepolia
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### Development

```bash
# Compile smart contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy

# Start frontend development server
npm run dev
```

## 📁 Project Structure

```
AnonSurvey/
├── contracts/                  # Solidity smart contracts
│   └── Survey.sol              # Main survey contract with FHE
├── scripts/                    # Deployment scripts
│   └── deploy.ts               # Contract deployment script
├── test/                       # Contract tests
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── Header.tsx      # Navigation header
│   │   │   └── WalletButton.tsx # Web3 wallet connection
│   │   ├── pages/              # Page components
│   │   │   ├── Index.tsx       # Landing page
│   │   │   ├── Surveys.tsx     # Survey listing
│   │   │   ├── CreateSurvey.tsx # Survey creation
│   │   │   ├── TakeSurvey.tsx  # Survey participation
│   │   │   └── SurveyResults.tsx # Results viewing
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useSurveyContract.ts # Contract interaction
│   │   │   └── useFHE.ts       # FHE operations
│   │   ├── contracts/          # Contract configuration
│   │   │   ├── SurveyABI.ts    # Contract ABI
│   │   │   └── config.ts       # Contract addresses
│   │   ├── config/             # App configuration
│   │   │   └── wagmi.ts        # Wagmi/RainbowKit setup
│   │   └── utils/              # Utility functions
│   │       └── fhe.ts          # FHE encryption utilities
│   └── package.json            # Frontend dependencies
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Root dependencies
└── README.md                   # This file
```

## 🔧 Technical Implementation

### Smart Contract Features

#### Survey Lifecycle Management
```solidity
// Create a new survey
function createSurvey(
    uint256 surveyId,
    string memory title,
    string memory description,
    uint32 numQuestions,
    uint256 duration,
    uint32 targetParticipants,
    uint32 minAge,
    bool requiresVerification
) external;

// Add questions to survey
function addQuestion(
    uint256 surveyId,
    bytes32 questionId,
    QuestionType qType,
    uint32 minValue,
    uint32 maxValue,
    string memory text
) external;

// Activate survey for participation
function activateSurvey(uint256 surveyId) external;
```

#### FHE Operations
```solidity
// Homomorphic addition for score accumulation
stats.totalScoreCipher = FHE.add(stats.totalScoreCipher, FHE.asEuint32(answer));

// Encrypted comparison for min/max updates
ebool isNewMin = FHE.lt(answer, stats.minResponseCipher);
stats.minResponseCipher = FHE.select(isNewMin, answer, stats.minResponseCipher);

// Variance calculation on encrypted data
euint32 avgSquared = FHE.div(stats.totalScoreCipher, uint32(stats.responseCount));
avgSquared = FHE.mul(avgSquared, avgSquared);
euint32 meanOfSquares = FHE.div(stats.sumOfSquaresCipher, uint32(stats.responseCount));
stats.varianceCipher = FHE.sub(meanOfSquares, avgSquared);
```

#### Gateway Integration
```solidity
// Request decryption of statistical results
uint256 requestId = Gateway.requestDecryption(
    cts,
    this.callbackQuestionDecryption.selector,
    0,
    block.timestamp + 100,
    false
);
```

### Frontend Implementation

#### FHE Client Integration
```typescript
// Encrypt multiple answers
const { handles, proof } = await encryptMultipleAnswers(
  answers,
  contractAddress,
  userAddress
);

// Submit encrypted response
await writeContract({
  address: CONTRACT_CONFIG.SURVEY_ADDRESS,
  abi: SURVEY_ABI,
  functionName: 'submitResponse',
  args: [surveyId, questionIds, handles, qualityScore, completionTime],
});
```

#### Web3 Integration
```typescript
// Contract interaction hook
export function useSurveyContract() {
  const { writeContract } = useWriteContract();
  
  const createSurvey = async (surveyData) => {
    return await writeContract({
      address: CONTRACT_CONFIG.SURVEY_ADDRESS,
      abi: SURVEY_ABI,
      functionName: 'createSurvey',
      args: [surveyData],
    });
  };
  
  return { createSurvey, /* other functions */ };
}
```

## 📊 Survey States

```
Draft → Active → Paused/Closed → Finalized → Decrypted
  ↓       ↓         ↓              ↓            ↓
Create   Activate  Pause/Close   Finalize    Decrypt Results
```

## 🎯 Use Cases

1. **Customer Satisfaction Surveys**: Anonymous feedback collection
2. **Employee Surveys**: Privacy-protected internal research
3. **Academic Research**: Privacy-preserving survey studies
4. **Product Ratings**: Anonymous product evaluation systems
5. **Voting Systems**: Confidential voting and opinion polls

## 🔐 Privacy Guarantees

- ✅ User responses are encrypted end-to-end
- ✅ No way to trace who submitted which answers
- ✅ Only aggregated statistical results are visible
- ✅ Even survey creators cannot view individual responses
- ✅ On-chain data remains completely confidential

## 🛠️ Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia
npm run deploy

# Start frontend dev server
npm run dev

# Build frontend for production
npm run build

# Clean build artifacts
npx hardhat clean

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📚 Technology Stack

### Smart Contracts
- **Solidity 0.8.24**: Smart contract language
- **Zama fhEVM**: Fully Homomorphic Encryption for Ethereum
- **Hardhat**: Development environment and testing framework
- **TypeChain**: TypeScript bindings for smart contracts

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection UI
- **shadcn/ui**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework

### Infrastructure
- **Sepolia Testnet**: Ethereum test network
- **Zama Gateway**: FHE decryption service
- **Infura/drpc.org**: RPC providers

## ⚠️ Important Notes

1. **Answer Range Validation**: All answers must be within specified min-max ranges
2. **Single Submission**: Each address can only submit once per survey
3. **Decryption Delay**: Gateway callbacks may take several minutes
4. **Gas Costs**: Multi-question surveys have higher gas fees
5. **State Management**: Surveys must follow proper state transition flow

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama**: For providing the FHE technology and fhEVM
- **Ethereum Foundation**: For the blockchain infrastructure
- **Open Source Community**: For the amazing tools and libraries

---

Built with ❤️ using Zama FHE Technology

**Author**: 0rangel-woodrown  
**Repository**: https://github.com/0rangel-woodrown/AnonSurvey