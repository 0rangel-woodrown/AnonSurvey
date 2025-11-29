/**
 * TakeSurvey Page - User fills out survey and submits encrypted answers
 *
 * Features:
 * 1. Display survey questions
 * 2. Collect user answers
 * 3. Encrypt answers using FHE
 * 4. Submit to smart contract
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFHE } from '@/hooks/useFHE';
import { encryptSurveyResponse } from '@/utils/fhe';
import {
  useSurveyContract,
  useSurveyInfo,
  useSurveyQuestions,
} from '@/hooks/useSurveyContract';
import { CONTRACT_CONFIG, QUESTION_TYPE } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';
import { toast } from 'sonner';
import {
  toastTxPending,
  toastTxSuccess,
  toastEncrypting,
  toastEncryptionComplete,
  handleTxError,
  isUserRejectedError,
} from '@/lib/toast-utils';

interface Question {
  id: `0x${string}`;
  typeId: number;
  text: string;
  minValue: number;
  maxValue: number;
}

const QUESTION_TYPE_LABELS: Record<number, string> = {
  [QUESTION_TYPE.RATING]: 'Rating',
  [QUESTION_TYPE.YES_NO]: 'Yes / No',
  [QUESTION_TYPE.MULTI_CHOICE]: 'Multiple Choice',
  [QUESTION_TYPE.NUMERIC]: 'Numeric',
  [QUESTION_TYPE.SENTIMENT]: 'Sentiment',
};

function getQuestionTypeLabel(typeId: number) {
  return QUESTION_TYPE_LABELS[typeId] ?? 'Rating';
}

export default function TakeSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const startTimeRef = useRef<number>(
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );
  const surveyIdBigInt = surveyId ? BigInt(surveyId) : undefined;

  // FHE Hook
  const { fhe, isInitialized, isLoading: isFheLoading, error: fheError } = useFHE(chainId, !!address);

  // Survey information
  const { surveyInfo, isLoading: isSurveyLoading } = useSurveyInfo(surveyIdBigInt);
  const { questions: contractQuestions, isLoading: isQuestionsLoading } = useSurveyQuestions(surveyIdBigInt);

  // Contract interaction
  const { isWriting, writeContractAsync } = useSurveyContract();

  // State
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const formattedQuestions = useMemo(() => {
    if (!Array.isArray(contractQuestions)) {
      return [];
    }
    return contractQuestions.map((q) => ({
      id: q.questionId,
      typeId: q.qType,
      text: q.questionText || 'Survey question',
      minValue: Number.isFinite(q.minValue) ? q.minValue : 0,
      maxValue: Number.isFinite(q.maxValue) ? q.maxValue : 5,
    }));
  }, [contractQuestions]);

  useEffect(() => {
    if (!formattedQuestions.length) {
      setQuestions([]);
      setAnswers({});
      return;
    }

    setQuestions(formattedQuestions);
    setAnswers((prev) => {
      const next: Record<string, number> = {};
      formattedQuestions.forEach((question) => {
        const prevValue = prev[question.id];
        if (typeof prevValue === 'number') {
          next[question.id] = prevValue;
        } else {
          next[question.id] = question.minValue;
        }
      });
      return next;
    });
  }, [formattedQuestions]);

  // Submit answers
  const handleSubmit = async () => {
    if (!address || !fhe || !surveyIdBigInt) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!CONTRACT_CONFIG.SURVEY_ADDRESS) {
      toast.error("Survey contract address is not configured");
      setSubmitError('Survey contract address is not configured.');
      return;
    }

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => answers[q.id] === undefined);
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions (${unansweredQuestions.length} remaining)`);
      setSubmitError(`Please answer all questions (${unansweredQuestions.length} remaining)`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('[TakeSurvey] Starting submission...');

      // 1. Prepare answer array
      const answerValues = questions.map(q => answers[q.id]);
      const questionIds = questions.map(q => q.id);

      console.log('[TakeSurvey] Answers:', answerValues);

      // 2. Calculate quality score and completion time
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
            (completedAt - (startTimeRef.current ?? completedAt)) / 1000
          )
        )
      );

      // 3. Encrypt all data in one call (shared inputProof)
      console.log('[TakeSurvey] Encrypting all data with FHE...');
      toastEncrypting('survey-encrypt');

      const {
        answerHandles,
        qualityScoreHandle,
        completionTimeHandle,
        inputProof
      } = await encryptSurveyResponse(
        answerValues,
        qualityScoreValue,
        elapsedSeconds,
        CONTRACT_CONFIG.SURVEY_ADDRESS,
        address
      );

      console.log('[TakeSurvey] Encryption successful');
      console.log('[TakeSurvey] Answer handles:', answerHandles.length);

      toastEncryptionComplete('survey-encrypt');

      // 4. Call contract with new parameter format
      console.log('[TakeSurvey] Calling smart contract...');

      if (!writeContractAsync) {
        throw new Error('Contract write function not available');
      }

      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
        abi: SURVEY_ABI,
        functionName: 'submitResponse',
        args: [
          surveyIdBigInt,
          questionIds,
          answerHandles,
          inputProof,
          qualityScoreHandle,
          completionTimeHandle
        ],
      });

      console.log('[TakeSurvey] Transaction submitted:', txHash);
      toastTxPending(txHash, "Submitting survey response...");
      setIsConfirming(true);

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log('[TakeSurvey] ✅ Submission successful');
      toastTxSuccess(txHash, "Survey response submitted successfully!");
      setSubmitSuccess(true);

    } catch (error: any) {
      console.error('[TakeSurvey] ❌ Submission failed:', error);

      if (isUserRejectedError(error)) {
        toast.error("Transaction rejected by user");
      } else {
        handleTxError(undefined, error);
        setSubmitError(error.message || 'Submission failed, please try again');
      }
    } finally {
      setIsConfirming(false);
      setIsSubmitting(false);
    }
  };

  // Render questions
  const renderQuestion = (question: Question) => {
    const value = answers[question.id] ?? question.minValue;
    const typeLabel = getQuestionTypeLabel(question.typeId);

    if (question.typeId === QUESTION_TYPE.YES_NO) {
      return (
        <Card key={question.id} className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{question.text}</CardTitle>
            <CardDescription>{typeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={value.toString()}
              onValueChange={(newValue) =>
                setAnswers(prev => ({ ...prev, [question.id]: parseInt(newValue, 10) }))
              }
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

    if (
      question.typeId === QUESTION_TYPE.RATING ||
      question.typeId === QUESTION_TYPE.MULTI_CHOICE ||
      question.typeId === QUESTION_TYPE.NUMERIC ||
      question.typeId === QUESTION_TYPE.SENTIMENT
    ) {
      return (
        <Card key={question.id} className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{question.text}</CardTitle>
            <CardDescription>
              {typeLabel} · Range: {question.minValue} - {question.maxValue}
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

    return (
      <Card key={question.id} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unsupported question type. Please update the frontend to handle type ID {question.typeId}.
          </p>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (isSurveyLoading || isFheLoading || isQuestionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isSurveyLoading
                ? 'Loading survey metadata...'
                : isQuestionsLoading
                  ? 'Loading survey questions from contract...'
                  : 'Initializing encryption system...'}
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
        {questions.length > 0 ? (
          questions.map(renderQuestion)
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No questions found for this survey. Please check if the survey is configured correctly.
            </AlertDescription>
          </Alert>
        )}
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
            disabled={isSubmitting || isWriting || isConfirming || questions.length === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isConfirming ? 'Waiting for confirmation...' : 'Encrypting and submitting...'}
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
