/**
 * SurveyResults Page - Survey creator can view their survey results
 *
 * Features:
 * 1. Display survey statistics
 * 2. Show question results
 * 3. Display participant count
 * 4. Show decrypted results if available
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, BarChart3, Users, Clock } from 'lucide-react';
import { useSurveyContract, useSurveyInfo } from '@/hooks/useSurveyContract';
import { CONTRACT_CONFIG } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';
import { useReadContract } from 'wagmi';

interface QuestionResult {
  questionId: string;
  questionText: string;
  average: number;
  variance: number;
  responseCount: number;
  decrypted: boolean;
}

export default function SurveyResults() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { address } = useAccount();

  // Survey information
  const { surveyInfo, isLoading: isSurveyLoading } = useSurveyInfo(surveyId ? BigInt(surveyId) : undefined);

  // Read survey results
  const { data: surveyResults, isLoading: isResultsLoading } = useReadContract({
    address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
    abi: SURVEY_ABI,
    functionName: 'getMySurveyResults',
    args: surveyId ? [BigInt(surveyId)] : undefined,
    query: {
      enabled: !!surveyId && !!address,
    },
  });

  // State
  const [questions, setQuestions] = useState<QuestionResult[]>([]);

  useEffect(() => {
    if (surveyResults && surveyInfo) {
      // Process survey results
      const [title, participantCount, targetParticipants, status, questionData, statistics] = surveyResults;
      
      const processedQuestions: QuestionResult[] = questionData.map((q: any, index: number) => ({
        questionId: q.questionId,
        questionText: q.questionText,
        average: statistics[index].decryptedAverage,
        variance: statistics[index].decryptedVariance,
        responseCount: statistics[index].responseCount,
        decrypted: statistics[index].decrypted,
      }));

      setQuestions(processedQuestions);
    }
  }, [surveyResults, surveyInfo]);

  // Check if user is the survey creator
  const isCreator = surveyInfo && surveyInfo[0] === address;

  // Loading state
  if (isSurveyLoading || isResultsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading survey results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - not creator
  if (!isCreator) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are not authorized to view these results. Only the survey creator can access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state - no survey
  if (!surveyInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Survey not found. Please check the survey ID.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const [creator, title, numQuestions, deadline, status, participantCount, targetParticipants] = surveyInfo;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Survey Results</h1>
        <p className="text-muted-foreground">
          View detailed analytics and results for your survey
        </p>
      </div>

      {/* Survey Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participantCount.toString()}</div>
            <p className="text-xs text-muted-foreground">
              Target: {targetParticipants.toString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numQuestions.toString()}</div>
            <p className="text-xs text-muted-foreground">
              Total questions in survey
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status === 1 ? 'Active' : 
               status === 2 ? 'Paused' : 
               status === 3 ? 'Closed' : 
               status === 4 ? 'Finalized' : 
               status === 5 ? 'Decrypted' : 'Draft'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current survey status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Survey Title */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            Survey ID: {surveyId} | Created by: {creator}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Question Results */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Question Results</h2>
        
        {questions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No questions found for this survey.
            </AlertDescription>
          </Alert>
        ) : (
          questions.map((question, index) => (
            <Card key={question.questionId}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Question {index + 1}
                </CardTitle>
                <CardDescription>
                  {question.questionText}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {question.decrypted ? question.average.toFixed(2) : 'Encrypted'}
                    </div>
                    <p className="text-sm text-muted-foreground">Average</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {question.decrypted ? question.variance.toFixed(2) : 'Encrypted'}
                    </div>
                    <p className="text-sm text-muted-foreground">Variance</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {question.responseCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Responses</p>
                  </div>
                </div>
                
                {!question.decrypted && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Results are encrypted. Decryption may be available after survey finalization.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Button onClick={() => window.location.href = '/surveys'}>
          Back to Surveys
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Results
        </Button>
      </div>
    </div>
  );
}
