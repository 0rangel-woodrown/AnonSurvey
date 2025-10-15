/**
 * TakeSurvey Page - User fills out survey and submits encrypted answers
 *
 * Features:
 * 1. Display survey questions
 * 2. Collect user answers
 * 3. Encrypt answers using FHE
 * 4. Submit to smart contract
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFHE } from '@/hooks/useFHE';
import {
  encryptCompletionTime,
  encryptMultipleAnswers,
  encryptQualityScore,
  generateQuestionId,
} from '@/utils/fhe';
import { useSurveyContract, useSurveyInfo } from '@/hooks/useSurveyContract';
import { CONTRACT_CONFIG, QUESTION_TYPE } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';
import { encodeAbiParameters } from 'viem';

interface Question {
  id: string;
  type: 'Rating' | 'YesNo' | 'MultiChoice' | 'Numeric' | 'Sentiment';
  text: string;
  minValue: number;
  maxValue: number;
}

export default function TakeSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { address } = useAccount();
  const chainId = useChainId();
  const startTimeRef = useRef<number>(
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );

  // FHE Hook
  const { fhe, isInitialized, isLoading: isFheLoading, error: fheError } = useFHE(chainId, !!address);

  // Survey information
  const { surveyInfo, isLoading: isSurveyLoading } = useSurveyInfo(surveyId ? BigInt(surveyId) : undefined);

  // Contract interaction
  const { isWriting, writeContract } = useSurveyContract();

  // State
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mock questions (should be loaded from contract)
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Mock loading questions from contract
    // Should actually call contract's getQuestions or similar method
    if (surveyInfo) {
      const mockQuestions: Question[] = Array.from({ length: Number(surveyInfo[2]) }, (_, i) => ({
        id: generateQuestionId(`Question ${i + 1}`, i),
        type: 'Rating',
        text: `Question ${i + 1}: Please rate this item`,
        minValue: 0,
        maxValue: 5
      }));
      setQuestions(mockQuestions);
    }
  }, [surveyInfo]);

  // Submit answers
  const handleSubmit = async () => {
    if (!address || !fhe || !surveyId) {
      return;
    }
    if (!CONTRACT_CONFIG.SURVEY_ADDRESS) {
      setSubmitError('Survey contract address is not configured.');
      return;
    }

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => answers[q.id] === undefined);
    if (unansweredQuestions.length > 0) {
      setSubmitError(`Please answer all questions (${unansweredQuestions.length} remaining)`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('[TakeSurvey] Starting submission...');

      // 1. Prepare answer array
      const answerValues = questions.map(q => answers[q.id]);
      const questionIds = questions.map(q => q.id as `0x${string}`);

      console.log('[TakeSurvey] Answers:', answerValues);

      // 2. Encrypt all answers
      console.log('[TakeSurvey] Encrypting answers with FHE...');
      const { handles } = await encryptMultipleAnswers(
        answerValues,
        CONTRACT_CONFIG.SURVEY_ADDRESS,
        address
      );

      console.log('[TakeSurvey] Encryption successful');
      console.log('[TakeSurvey] Handles:', handles.length);

      // 3. Convert to contract required format (bytes[] with abi-encoded uint256)
      const encryptedAnswers = handles.map(handle =>
        encodeAbiParameters([{ type: 'uint256' }], [BigInt(handle)])
      );

      // 4. Encrypt quality score & completion time separately
      const averageScore =
        answerValues.reduce((acc, value) => acc + value, 0) / Math.max(answerValues.length, 1);
      const qualityScoreValue = Math.min(65535, Math.max(0, Math.round(averageScore * 100)));
      const completedAt =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsedSeconds = Math.min(
        255,
        Math.max(
          1,
          Math.round(
            (completedAt - (startTimeRef.current ?? completedAt)) /
              (typeof performance !== 'undefined' ? 1000 : 1000)
          )
        )
      );

      const { handle: qualityScoreHandle } = await encryptQualityScore(
        qualityScoreValue,
        CONTRACT_CONFIG.SURVEY_ADDRESS,
        address
      );

      const { handle: completionTimeHandle } = await encryptCompletionTime(
        elapsedSeconds,
        CONTRACT_CONFIG.SURVEY_ADDRESS,
        address
      );

      const qualityScoreCipher = BigInt(qualityScoreHandle);
      const completionTimeCipher = BigInt(completionTimeHandle);

      // 5. Call contract
      console.log('[TakeSurvey] Calling smart contract...');

      // Actual contract call
      if (!writeContract) {
        throw new Error('Contract not available');
      }

      // Call submitResponse function
      const tx = await writeContract({
        address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
        abi: SURVEY_ABI,
        functionName: 'submitResponse',
        args: [
          BigInt(surveyId),
          questionIds,
          encryptedAnswers,
          qualityScoreCipher,
          completionTimeCipher
        ],
      });

      console.log('[TakeSurvey] Transaction submitted:', tx);
      
      // Wait for transaction confirmation
      if (tx && typeof tx.wait === 'function') {
        await tx.wait();
      }

      console.log('[TakeSurvey] ✅ Submission successful');
      setSubmitSuccess(true);

    } catch (error: any) {
      console.error('[TakeSurvey] ❌ Submission failed:', error);
      setSubmitError(error.message || 'Submission failed, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render questions
  const renderQuestion = (question: Question) => {
    const value = answers[question.id] ?? question.minValue;

    if (question.type === 'Rating') {
      return (
        <Card key={question.id} className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{question.text}</CardTitle>
            <CardDescription>
              Rating range: {question.minValue} - {question.maxValue}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[value]}
                onValueChange={([newValue]) => setAnswers(prev => ({ ...prev, [question.id]: newValue }))}
                min={question.minValue}
                max={question.maxValue}
                step={1}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-primary">
                {value}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (question.type === 'YesNo') {
      return (
        <Card key={question.id} className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={value.toString()}
              onValueChange={(newValue) => setAnswers(prev => ({ ...prev, [question.id]: parseInt(newValue) }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`}>No</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Loading state
  if (isSurveyLoading || isFheLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isSurveyLoading ? 'Loading survey...' : 'Initializing encryption system...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (fheError || !isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fheError?.message || 'FHE initialization failed, please refresh and try again'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Submission Successful!</h2>
              <p className="text-muted-foreground">
                Your answers have been encrypted and submitted to the blockchain.<br />
                Thank you for your participation!
              </p>
              <Button onClick={() => window.location.href = '/surveys'}>
                Return to Survey List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main interface
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {surveyInfo?.[1] || 'Survey'}
        </h1>
        <p className="text-muted-foreground">
          Your answers will be encrypted using FHE fully homomorphic encryption technology, completely anonymous and untraceable
        </p>
      </div>

      {/* FHE Status Indicator */}
      <Alert className="mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription>
          ✅ Encryption system ready - Your answers will be fully encrypted
        </AlertDescription>
      </Alert>

      {/* Question List */}
      <div className="space-y-4 mb-6">
        {questions.map(renderQuestion)}
      </div>

      {/* Error Message */}
      {submitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isWriting || questions.length === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Encrypting and submitting...
              </>
            ) : (
              'Submit Answers'
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Total {questions.length} questions, answered {Object.keys(answers).length} questions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
