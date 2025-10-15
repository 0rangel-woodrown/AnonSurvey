# AnonSurvey Frontend

The frontend application for AnonSurvey - a fully anonymous on-chain survey system powered by Zama's FHE technology.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Tech Stack
- **React 18**: UI framework with TypeScript
- **Vite**: Fast build tool and dev server
- **Wagmi + RainbowKit**: Web3 wallet integration
- **shadcn/ui**: Modern UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Zama FHE**: Client-side encryption library

### Key Features
- 🔐 **FHE Integration**: Client-side encryption of survey responses
- 🌐 **Web3 Connectivity**: Seamless wallet connection
- 📱 **Responsive Design**: Mobile-first UI/UX
- 🎨 **Modern UI**: Beautiful, accessible components
- ⚡ **Fast Performance**: Optimized with Vite

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Navigation header
│   └── WalletButton.tsx # Web3 wallet connection
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   ├── Surveys.tsx     # Survey listing
│   ├── CreateSurvey.tsx # Survey creation
│   ├── TakeSurvey.tsx  # Survey participation
│   └── SurveyResults.tsx # Results viewing
├── hooks/              # Custom React hooks
│   ├── useSurveyContract.ts # Contract interaction
│   └── useFHE.ts       # FHE operations
├── contracts/          # Contract configuration
│   ├── SurveyABI.ts    # Contract ABI
│   └── config.ts       # Contract addresses
├── config/             # App configuration
│   └── wagmi.ts        # Wagmi/RainbowKit setup
└── utils/              # Utility functions
    └── fhe.ts          # FHE encryption utilities
```

## 🔧 Development

### Environment Setup
Create a `.env.local` file in the frontend directory:

```env
VITE_SURVEY_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=sepolia
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🔐 FHE Integration

The frontend integrates with Zama's FHE technology to encrypt survey responses before submission:

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

## 🌐 Web3 Integration

### Wallet Connection
- **RainbowKit**: Beautiful wallet connection UI
- **Wagmi**: React hooks for Ethereum
- **Multi-wallet Support**: MetaMask, WalletConnect, Coinbase Wallet, etc.

### Contract Interaction
```typescript
// Custom hook for contract operations
const { createSurvey, addQuestion, activateSurvey } = useSurveyContract();

// Create a new survey
await createSurvey({
  surveyId: 1n,
  title: "Customer Satisfaction Survey",
  description: "Help us improve our service",
  numQuestions: 5,
  duration: 7n * 24n * 3600n, // 7 days
  targetParticipants: 100,
  minAge: 18,
  requiresVerification: false
});
```

## 🎨 UI Components

Built with shadcn/ui components for a modern, accessible design:

- **Cards**: Survey listings and details
- **Forms**: Survey creation and participation
- **Buttons**: Interactive elements with hover effects
- **Dialogs**: Modals for confirmations and sharing
- **Toast**: User feedback notifications

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablets
- **Desktop**: Full-featured desktop experience
- **Dark Mode**: Built-in dark theme support

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Build the project
npm run build

# Deploy the dist folder to Netlify
```

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and building:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 5173,
  },
  // ... other config
});
```

### Tailwind Configuration
Custom Tailwind setup with shadcn/ui:

```typescript
// tailwind.config.ts
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

## 📚 Learn More

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see the main project README for details.