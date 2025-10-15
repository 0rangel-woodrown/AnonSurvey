import { Link } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { Shield, Github } from 'lucide-react';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg gradient-primary glow-primary">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AnonSurvey
              </h1>
              <p className="text-xs text-muted-foreground">Fully Anonymous On-Chain Surveys</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-smooth">
              Home
            </Link>
            <Link to="/surveys" className="text-foreground/80 hover:text-foreground transition-smooth">
              Surveys
            </Link>
            <Link to="/create" className="text-foreground/80 hover:text-foreground transition-smooth">
              Create
            </Link>
            <Link to="/about" className="text-foreground/80 hover:text-foreground transition-smooth">
              About
            </Link>
            <a 
              href="https://github.com/0rangel-woodrown/AnonSurvey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-smooth flex items-center gap-1"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          <WalletButton />
        </div>
      </div>
    </header>
  );
};
