import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/FeatureCard';
import { StatsCard } from '@/components/StatsCard';
import { Link } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Zap, Eye, Database } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-full glass-card border-primary/30 mb-4">
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Powered by Zama FHE Technology
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Fully Anonymous
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-glow-pulse">
                On-Chain Surveys
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leveraging Fully Homomorphic Encryption (FHE) technology to ensure survey responses 
              are encrypted on-chain, achieving complete privacy protection while enabling 
              encrypted data statistical analysis
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/create">
                <Button size="lg" className="gradient-primary glow-primary hover:scale-105 transition-smooth text-lg px-8">
                  Create Survey
                </Button>
              </Link>
              <Link to="/surveys">
                <Button size="lg" variant="secondary" className="glass-card hover:border-accent/50 transition-smooth text-lg px-8">
                  Browse Surveys
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <StatsCard label="Total On-Chain Surveys" value="1,234" trend="+12% this month" />
            <StatsCard label="Encrypted Responses" value="45,678" trend="+28% this month" />
            <StatsCard label="Active Users" value="8,901" trend="+15% this month" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Core Technical Features</h2>
            <p className="text-xl text-muted-foreground">
              Revolutionary privacy protection technology based on Zama FHE
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
            <FeatureCard
              icon={Lock}
              title="End-to-End Encryption"
              description="Responses are encrypted on client-side, stored encrypted on-chain, and no one can decrypt the original data"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Homomorphic Statistics"
              description="Perform statistical analysis on encrypted data without decryption, obtaining accurate aggregate results"
            />
            <FeatureCard
              icon={Shield}
              title="Privacy Protection"
              description="Based on zero-knowledge proofs, ensuring complete anonymity of survey respondents with no traceability"
            />
            <FeatureCard
              icon={Database}
              title="On-Chain Storage"
              description="All data stored on blockchain, ensuring data immutability and permanent availability"
            />
            <FeatureCard
              icon={Zap}
              title="Instant Response"
              description="Optimized smart contract design ensuring fast response for survey creation and submission"
            />
            <FeatureCard
              icon={Eye}
              title="Public Transparency"
              description="Statistical results are publicly verifiable, anyone can verify the correctness of calculations"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center space-y-6 border-primary/20 glow-primary animate-fade-in">
            <h2 className="text-4xl font-bold">Start Using FHE Survey System</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect your wallet and create your first fully anonymous on-chain survey now
            </p>
            <Link to="/create">
              <Button size="lg" className="gradient-secondary glow-accent hover:scale-105 transition-smooth text-lg px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
