import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Database, Zap, CheckCircle2 } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 animate-fade-in text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About FHE Technology</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how Fully Homomorphic Encryption protects your privacy
          </p>
        </div>

        <div className="space-y-8 animate-fade-in-up">
          {/* What is FHE */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg gradient-primary">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">What is Fully Homomorphic Encryption?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-lg text-muted-foreground space-y-4">
              <p>
                Fully Homomorphic Encryption (FHE) is a revolutionary encryption technology that allows 
                computations to be performed directly on encrypted data without the need for decryption. 
                This means data remains encrypted throughout the entire processing pipeline.
              </p>
              <p>
                Zama is a leading company in the FHE space, providing open-source FHE libraries 
                that enable developers to build fully privacy-preserving applications.
              </p>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg gradient-secondary">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl">How It Works</CardTitle>
              </div>
              <CardDescription className="text-base">
                Technical workflow of the FHE survey system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">1. Client-Side Encryption</h3>
                      <p className="text-muted-foreground">
                        User responses are encrypted locally using FHE, generating ciphertext
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">2. On-Chain Storage</h3>
                      <p className="text-muted-foreground">
                        Encrypted responses are submitted to smart contracts and stored on the blockchain
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">3. Homomorphic Computation</h3>
                      <p className="text-muted-foreground">
                        Statistical analysis performed directly on encrypted data without decrypting original responses
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">4. Public Results</h3>
                      <p className="text-muted-foreground">
                        Statistical results are publicly verifiable, but original responses remain permanently private
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card border-white/10 hover:border-accent/30 transition-smooth">
              <CardHeader>
                <div className="p-2 rounded-lg gradient-primary w-fit mb-3">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Complete Privacy</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Responses remain encrypted at all times, even survey creators cannot view individual raw responses
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10 hover:border-accent/30 transition-smooth">
              <CardHeader>
                <div className="p-2 rounded-lg gradient-primary w-fit mb-3">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Decentralized</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                All data stored on blockchain with no single point of failure, ensuring permanent availability
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10 hover:border-accent/30 transition-smooth">
              <CardHeader>
                <div className="p-2 rounded-lg gradient-primary w-fit mb-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Verifiable</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                All statistical results can be verified through zero-knowledge proofs
              </CardContent>
            </Card>
          </div>

          {/* Use Cases */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl">Use Cases</CardTitle>
              <CardDescription className="text-base">
                Typical applications of the FHE survey system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <p><span className="text-foreground font-semibold">Anonymous Voting:</span> DAO governance, community decisions requiring anonymous voting</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <p><span className="text-foreground font-semibold">Market Research:</span> Collect user feedback while protecting commercially sensitive information</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <p><span className="text-foreground font-semibold">Health Data:</span> Anonymous collection of health-related data for research purposes</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <p><span className="text-foreground font-semibold">Employee Surveys:</span> Anonymous feedback collection within organizations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
