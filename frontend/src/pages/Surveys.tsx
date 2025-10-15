import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Lock, TrendingUp, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { useSurveyList } from '@/hooks/useSurveyList';

const Surveys = () => {
  const { surveys, isLoading, error } = useSurveyList();

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="gradient-primary">Active</Badge>;
      case 2:
        return <Badge variant="secondary">Paused</Badge>;
      case 3:
        return <Badge variant="outline">Closed</Badge>;
      case 4:
        return <Badge variant="outline">Finalized</Badge>;
      case 5:
        return <Badge variant="outline">Decrypted</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const formatDeadline = (deadline: number) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline * 1000);
    if (Number.isNaN(date.getTime())) return 'No deadline';
    return date.toLocaleDateString();
  };

  const formatId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
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
        ) : error ? (
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to load surveys</h2>
            <p className="text-muted-foreground">{error}</p>
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
                    {survey.title || 'Untitled Survey'}
                  </CardTitle>
                  {getStatusBadge(survey.status)}
                </div>
                <CardDescription className="text-base">
                  {survey.description || 'No description provided.'}
                </CardDescription>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="font-mono">{formatId(survey.id)}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{survey.participantCount} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{survey.numQuestions} questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline: {formatDeadline(survey.deadline)}</span>
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
