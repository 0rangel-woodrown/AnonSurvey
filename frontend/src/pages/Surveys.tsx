import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Lock, TrendingUp, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { CONTRACT_CONFIG } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';

interface Survey {
  id: number;
  title: string;
  description: string;
  participants: number;
  questions: number;
  status: string;
  deadline: string;
  creator: string;
}

const Surveys = () => {
  const { address, isConnected } = useAccount();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get global statistics to know how many surveys exist
  const { data: globalStats } = useReadContract({
    address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: 'getGlobalStatistics',
    query: {
      enabled: !!CONTRACT_CONFIG.SURVEY_ADDRESS,
    },
  });

  // Load surveys from blockchain
  useEffect(() => {
    const loadSurveys = async () => {
      if (!globalStats || !CONTRACT_CONFIG.SURVEY_ADDRESS) {
        setIsLoading(false);
        return;
      }

      const [totalSurveys] = globalStats as [bigint, bigint, bigint];
      const surveyCount = Number(totalSurveys);
      
      if (surveyCount === 0) {
        setSurveys([]);
        setIsLoading(false);
        return;
      }

      const loadedSurveys: Survey[] = [];
      
      // Load surveys from ID 1 to surveyCount
      for (let i = 1; i <= surveyCount; i++) {
        try {
          // Note: This would need to be implemented with a proper contract call
          // For now, we'll use the example survey that was deployed
          if (i === 1) {
            loadedSurveys.push({
              id: 1,
              title: '2024 Cryptocurrency Usage Habits Survey',
              description: 'Understanding user preferences and holdings of different cryptocurrencies',
              participants: 0,
              questions: 3,
              status: 'active',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              creator: '0x37483F5093A12c49a397b58884ecDB1614d7e7DE',
            });
          }
        } catch (error) {
          console.error(`Error loading survey ${i}:`, error);
        }
      }
      
      setSurveys(loadedSurveys);
      setIsLoading(false);
    };

    loadSurveys();
  }, [globalStats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="gradient-primary">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container mx-auto">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Surveys</h1>
          <p className="text-xl text-muted-foreground">
            Browse and participate in fully anonymous on-chain surveys
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading surveys from blockchain...</p>
            </div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No surveys available yet.</p>
            <p className="text-muted-foreground">Create the first survey to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
            {surveys.map((survey) => (
            <Card key={survey.id} className="glass-card border-white/10 hover:border-primary/30 transition-smooth group">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-2xl group-hover:text-primary transition-smooth">
                    {survey.title}
                  </CardTitle>
                  {getStatusBadge(survey.status)}
                </div>
                <CardDescription className="text-base">
                  {survey.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{survey.participants} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{survey.questions} questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 text-accent" />
                  <span>FHE Encrypted Protection</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link className="flex-1" to={`/survey/${survey.id}`}>
                    <Button className="w-full gradient-primary glow-primary hover:scale-105 transition-smooth">
                      Fill Survey
                    </Button>
                  </Link>
                  <Link to={`/results/${survey.id}`}>
                    <Button variant="secondary" className="glass-card hover:border-accent/50 transition-smooth">
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Surveys;
