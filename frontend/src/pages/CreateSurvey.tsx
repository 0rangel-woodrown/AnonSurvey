import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Lock, Copy, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSurveyContract, useWatchSurveyEvents } from '@/hooks/useSurveyContract';
import { useAccount } from 'wagmi';
import { CONTRACT_CONFIG } from '@/contracts/config';
import { SURVEY_ABI } from '@/contracts/SurveyABI';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Question {
  id: number;
  text: string;
  type: 'text' | 'choice';
}

const CreateSurvey = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { isWriting, writeContractAsync } = useSurveyContract();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('7'); // Days
  const [targetResponses, setTargetResponses] = useState('100');
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: '', type: 'text' }
  ]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [createdSurveyId, setCreatedSurveyId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Watch for SurveyCreated events
  useWatchSurveyEvents('SurveyCreated', (logs) => {
    if (logs.length > 0) {
      const log = logs[0];
      const surveyId = Number(log.args.surveyId);
      setCreatedSurveyId(surveyId);
      setShowShareModal(true);

      toast({
        title: "Survey created successfully!",
        description: `Survey ID: ${surveyId}`,
      });
    }
  });

  const addQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    setQuestions([...questions, { id: newId, text: '', type: 'text' }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: number, text: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, text } : q
    ));
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!title || questions.some(q => !q.text)) {
      toast({
        title: "Please complete survey information",
        description: "Title and all questions cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique survey ID (using timestamp + random)
      const surveyId = BigInt(Date.now() + Math.floor(Math.random() * 1000));
      
      console.log('Generated surveyId:', surveyId.toString());
      
      // Convert days to seconds
      const durationSeconds = BigInt(parseInt(duration) * 24 * 60 * 60);
      const targetResponsesBigInt = BigInt(parseInt(targetResponses));

      // Call the contract directly with correct parameters
      if (!writeContractAsync) {
        throw new Error('Contract not available');
      }

      console.log('Creating survey with ID:', surveyId);
      console.log('Contract address:', CONTRACT_CONFIG.SURVEY_ADDRESS);
      console.log('Environment check:', {
        isProduction: import.meta.env.PROD,
        isDevelopment: import.meta.env.DEV,
        nodeEnv: import.meta.env.MODE,
        contractAddress: CONTRACT_CONFIG.SURVEY_ADDRESS,
        chainId: CONTRACT_CONFIG.CHAIN_ID
      });
      console.log('Survey data:', {
        title,
        description,
        questions: questions.length,
        duration: parseInt(duration),
        targetResponses: parseInt(targetResponses)
      });

      // Call createSurvey with correct parameters
      const txHash = await writeContractAsync({
        address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
        abi: SURVEY_ABI,
        functionName: 'createSurvey',
        args: [
          surveyId,
          title,
          description,
          questions.length, // numQuestions
          durationSeconds,
          targetResponsesBigInt,
          18, // minAge
          false // requiresVerification
        ],
      });

      console.log('Survey creation transaction hash:', txHash);
      
      // Add questions to the survey
      for (let i = 0; i < questions.length; i++) {
        // Generate a proper 32-byte questionId using a simpler method
        const randomBytes = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(randomBytes);
        } else {
          // Fallback for environments without crypto.getRandomValues
          for (let i = 0; i < 32; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
          }
        }
        const questionId = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
        
        console.log(`Adding question ${i + 1} with ID:`, questionId);
        
        const questionTxHash = await writeContractAsync({
          address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
          abi: SURVEY_ABI,
          functionName: 'addQuestion',
          args: [
            surveyId,
            questionId,
            0, // QuestionType.Rating
            0, // minValue
            5, // maxValue
            questions[i].text
          ],
        });
        
        console.log(`Question ${i + 1} added, tx hash:`, questionTxHash);
      }

      // Activate the survey
      const activateTxHash = await writeContractAsync({
        address: CONTRACT_CONFIG.SURVEY_ADDRESS as `0x${string}`,
        abi: SURVEY_ABI,
        functionName: 'activateSurvey',
        args: [surveyId],
      });
      
      console.log('Survey activated, tx hash:', activateTxHash);

      setCreatedSurveyId(Number(surveyId));
      setShowShareModal(true);

      toast({
        title: "Survey created successfully!",
        description: `Survey ID: ${surveyId}`,
      });

    } catch (error: any) {
      console.error('Error creating survey:', error);
      toast({
        title: "Error creating survey",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const getShareUrl = () => {
    if (createdSurveyId === null) return '';
    // Use the production domain for sharing
    return `https://anon-survey.vercel.app/survey/${createdSurveyId}`;
  };

  const copyShareUrl = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Share URL copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Create Survey</h1>
          <p className="text-xl text-muted-foreground">
            Design your encrypted survey, all responses will be protected by FHE encryption
          </p>
        </div>

        <div className="space-y-6 animate-fade-in-up">
          {/* Basic Info */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set the title and description of your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., 2024 Cryptocurrency Usage Habits Survey"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-card border-white/10 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Survey Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly explain the purpose and content of the survey"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-card border-white/10 focus:border-primary/50 min-h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="7"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="glass-card border-white/10 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetResponses">Target Responses</Label>
                  <Input
                    id="targetResponses"
                    type="number"
                    placeholder="100"
                    value={targetResponses}
                    onChange={(e) => setTargetResponses(e.target.value)}
                    className="glass-card border-white/10 focus:border-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add the questions you want to collect
                  </CardDescription>
                </div>
                <Button
                  onClick={addQuestion}
                  size="sm"
                  className="gradient-secondary glow-accent hover:scale-105 transition-smooth"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2 p-4 rounded-lg glass-card border border-white/5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`question-${question.id}`}>Question {index + 1}</Label>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    id={`question-${question.id}`}
                    placeholder="Enter question content"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    className="glass-card border-white/10 focus:border-accent/50"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              disabled={isWriting || !isConnected}
              className="flex-1 gradient-primary glow-primary hover:scale-105 transition-smooth text-lg"
            >
              <Lock className="w-5 h-5 mr-2" />
              {isWriting ? 'Creating...' : 'Encrypt and Publish On-Chain'}
            </Button>
          </div>
        </div>

        {/* Share URL Modal */}
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-accent" />
                Survey Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Your survey has been encrypted and published on-chain. Share this URL with participants.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Survey ID</Label>
                <div className="p-3 rounded-lg glass-card border border-white/10">
                  <code className="text-accent">{createdSurveyId}</code>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={getShareUrl()}
                    className="glass-card border-white/10 font-mono text-sm"
                  />
                  <Button
                    onClick={copyShareUrl}
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="p-4 rounded-lg glass-card border border-accent/20 bg-accent/5">
                <p className="text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 inline mr-1" />
                  All responses will be encrypted using FHE technology. Individual answers remain private forever.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreateSurvey;
