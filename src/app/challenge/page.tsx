
"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { ChallengeDisplay } from "@/components/code-crafter/challenge-display";
import { CodeEditorPanel } from "@/components/code-crafter/code-editor-panel";
import { ConceptualAnswerPanel } from "@/components/code-crafter/conceptual-answer-panel";
import { GradingResults } from "@/components/code-crafter/grading-results";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateQuestion, type QuestionGenerationInput, type QuestionGenerationOutput } from "@/ai/flows/question-generation";
import { gradeCode, type GradeCodeInput, type GradeCodeOutput } from "@/ai/flows/code-grading";
import { gradeAnswer, type AnswerGradingInput, type AnswerGradingOutput } from "@/ai/flows/answer-grading";
import { generateSolution, type SolutionGenerationInput, type SolutionGenerationOutput } from "@/ai/flows/solution-generation";
import { AlertCircle, Code, MessageCircle, Home, RotateCcw, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs,getCountFromServer } from "firebase/firestore";
import { ACHIEVEMENTS_LIST, type Achievement, type UserAchievement } from "@/lib/achievements";


type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type QuestionTypePreference = "coding" | "conceptual" | "both";
type ActiveDisplayType = "coding" | "conceptual";

export interface ChallengeHistoryEntry {
  id?: string; 
  userId: string;
  topic: string;
  difficulty: Difficulty;
  questionType: ActiveDisplayType;
  question: string;
  userSolution: string; 
  gradingResult: GradeCodeOutput | AnswerGradingOutput;
  createdAt: Timestamp;
  generatedSolution?: SolutionGenerationOutput | null;
}


function ChallengePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [initialDifficulty, setInitialDifficulty] = useState<Difficulty | null>(null);
  const [initialTopic, setInitialTopic] = useState<string | null>(null);
  const [initialPreference, setInitialPreference] = useState<QuestionTypePreference | null>(null);

  const [challengeData, setChallengeData] = useState<QuestionGenerationOutput | null>(null);
  const [activeDisplayType, setActiveDisplayType] = useState<ActiveDisplayType | null>(null);
  
  const [code, setCode] = useState<string>("");
  const [conceptualAnswer, setConceptualAnswer] = useState<string>("");
  
  const [gradingResult, setGradingResult] = useState<GradeCodeOutput | AnswerGradingOutput | null>(null);
  const [generatedSolution, setGeneratedSolution] = useState<SolutionGenerationOutput | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasValidParams, setHasValidParams] = useState<boolean | null>(null);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const resetChallengeState = useCallback((resetFull = true) => {
    if (resetFull) {
      setChallengeData(null);
      setActiveDisplayType(null);
    }
    setCode("");
    setConceptualAnswer("");
    setGradingResult(null);
    setError(null);
    setGeneratedSolution(null);
    setIsLoadingSolution(false);
    setSolutionError(null);
  }, []);

  const fetchQuestionForChallenge = useCallback(async (
    currentTopic: string, 
    currentDifficulty: Difficulty, 
    currentPreference: QuestionTypePreference
  ) => {
    if (!currentTopic?.trim() || !currentDifficulty || !currentPreference) {
      resetChallengeState(true);
      return;
    }

    setIsLoadingQuestion(true);
    resetChallengeState(true); 

    const preferredTypeForApi = currentPreference === "both" ? "any" : currentPreference;

    try {
      const questionInput: QuestionGenerationInput = { 
        topic: currentTopic, 
        difficulty: currentDifficulty, 
        preferredQuestionType: preferredTypeForApi 
      };
      const output: QuestionGenerationOutput = await generateQuestion(questionInput);
      setChallengeData(output);

      if (output.questionTypeGenerated === "coding") {
        setActiveDisplayType("coding");
        toast({ title: "Coding Challenge Ready!", description: `A coding question for ${currentTopic} (${currentDifficulty}) generated.`});
      } else if (output.questionTypeGenerated === "conceptual") {
        setActiveDisplayType("conceptual");
        toast({ title: "Conceptual Question Ready!", description: `A conceptual question for ${currentTopic} (${currentDifficulty}) generated.`});
      } else if (output.questionTypeGenerated === "both") {
        setActiveDisplayType("coding"); 
        toast({ title: "Challenges Ready!", description: `Coding and conceptual questions for ${currentTopic} (${currentDifficulty}) generated.`});
      }
    } catch (questionError: any) {
      console.error("Error generating question(s):", questionError);
      let userErrorMessage = `Failed to generate question(s) for "${currentTopic}". Please try again or return to the dashboard to select different parameters.`;
      let toastDescription = `Could not generate question(s) for "${currentTopic}".`;

      if (questionError && typeof questionError.message === 'string') {
        const lowerCaseMessage = questionError.message.toLowerCase();
        if (lowerCaseMessage.includes('503') || lowerCaseMessage.includes('service unavailable') || lowerCaseMessage.includes('overloaded')) {
          userErrorMessage = `The AI service seems to be overloaded or temporarily unavailable. This can sometimes be reported as a 503 error. Please try again in a few moments. If the problem persists, consider trying different parameters or checking back later.`;
          toastDescription = "AI service is currently overloaded. Please try again shortly.";
        }
      }
      
      setError(userErrorMessage);
      toast({ variant: "destructive", title: "Question Generation Error", description: toastDescription });
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [toast, resetChallengeState]);

  useEffect(() => {
    if (authLoading || !user) return; 

    const difficultyParam = searchParams.get("difficulty") as Difficulty | null;
    const topicParam = searchParams.get("topic");
    const typeParam = searchParams.get("type") as QuestionTypePreference | null;

    if (difficultyParam && topicParam && typeParam) {
      setInitialDifficulty(difficultyParam);
      setInitialTopic(topicParam);
      setInitialPreference(typeParam);
      setHasValidParams(true);
      fetchQuestionForChallenge(topicParam, difficultyParam, typeParam);
    } else {
      setHasValidParams(false);
      setError("Challenge parameters not found. Please configure your challenge from the dashboard.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, authLoading]);


  const currentDisplayedQuestion = useMemo(() => {
    if (!challengeData || !activeDisplayType) return null;
    return activeDisplayType === 'coding' ? challengeData.codingQuestion : challengeData.conceptualQuestion;
  }, [challengeData, activeDisplayType]);

  const currentDisplayedHint = useMemo(() => {
    if (!challengeData || !activeDisplayType) return null;
    return activeDisplayType === 'coding' ? challengeData.codingHint : challengeData.conceptualHint;
  }, [challengeData, activeDisplayType]);


  const checkAndAwardAchievements = async (userId: string, newlySavedHistoryEntry: ChallengeHistoryEntry) => {
    if (!newlySavedHistoryEntry.gradingResult.passed) return;

    const userAchievementsRef = collection(db, "userAchievements");
    const passedChallengeDifficulty = newlySavedHistoryEntry.difficulty;

    // 1. Initiate Programmer (First Passed Challenge)
    const initiateProgrammerAchievement = ACHIEVEMENTS_LIST.find(a => a.id === 'initiate_programmer')!;
    const historyQuery = query(collection(db, "challengeHistory"), where("userId", "==", userId), where("gradingResult.passed", "==", true));
    const historySnapshot = await getDocs(historyQuery);
    
    if (historySnapshot.size === 1) { // The one just saved is the first passed one
        const existingAchievementQuery = query(userAchievementsRef, where("userId", "==", userId), where("achievementId", "==", initiateProgrammerAchievement.id));
        const existingAchievementSnapshot = await getDocs(existingAchievementQuery);
        if (existingAchievementSnapshot.empty) {
            await addDoc(userAchievementsRef, {
                userId,
                achievementId: initiateProgrammerAchievement.id,
                name: initiateProgrammerAchievement.name,
                description: initiateProgrammerAchievement.description,
                iconName: initiateProgrammerAchievement.iconName,
                earnedAt: serverTimestamp(),
            });
            toast({ title: "Badge Unlocked!", description: `You've earned: ${initiateProgrammerAchievement.name}` });
            console.log(`[ACHIEVEMENT_AWARDED] User ${userId} earned ${initiateProgrammerAchievement.name}`);
        }
    }

    // 2. [Difficulty] Challenger (e.g., Passed 3 at Beginner)
    const difficultyAchievements = ACHIEVEMENTS_LIST.filter(ach => ach.criteriaDifficulty && ach.criteriaCount);
    for (const achievement of difficultyAchievements) {
        if (achievement.criteriaDifficulty === passedChallengeDifficulty && achievement.criteriaCount) {
            const difficultyHistoryQuery = query(collection(db, "challengeHistory"),
                where("userId", "==", userId),
                where("difficulty", "==", passedChallengeDifficulty),
                where("gradingResult.passed", "==", true)
            );
            const difficultyHistorySnapshot = await getCountFromServer(difficultyHistoryQuery);
            const passedCount = difficultyHistorySnapshot.data().count;

            if (passedCount === achievement.criteriaCount) {
                const existingAchievementQuery = query(userAchievementsRef, where("userId", "==", userId), where("achievementId", "==", achievement.id));
                const existingAchievementSnapshot = await getDocs(existingAchievementQuery);
                if (existingAchievementSnapshot.empty) {
                     await addDoc(userAchievementsRef, {
                        userId,
                        achievementId: achievement.id,
                        name: achievement.name,
                        description: achievement.description,
                        iconName: achievement.iconName,
                        earnedAt: serverTimestamp(),
                    });
                    toast({ title: "Badge Unlocked!", description: `You've earned: ${achievement.name}` });
                    console.log(`[ACHIEVEMENT_AWARDED] User ${userId} earned ${achievement.name}`);
                }
            }
        }
    }
  };


  const saveChallengeToHistory = async (
    currentGradingResult: GradeCodeOutput | AnswerGradingOutput,
    userSolution: string,
    solutionOutput: SolutionGenerationOutput | null 
  ) => {
    if (!user) {
      console.error("[SAVE_HISTORY_ERROR] User not available, cannot save history.");
      toast({ variant: "destructive", title: "History Save Error", description: "You must be logged in to save history." });
      return;
    }
    if (!initialTopic || !initialDifficulty || !activeDisplayType || !currentDisplayedQuestion) {
      console.error("[SAVE_HISTORY_ERROR] Missing data to save history: Topic, Difficulty, Type, or Question is null.");
      console.log("[SAVE_HISTORY_DATA] Current values:", { initialTopic, initialDifficulty, activeDisplayType, currentDisplayedQuestionLoaded: !!currentDisplayedQuestion });
      toast({ variant: "destructive", title: "History Save Error", description: "Cannot save: missing critical challenge details."});
      return;
    }

    console.log("[SAVE_HISTORY_ATTEMPT] Attempting to save challenge to history...");
    
    const historyEntryData: Omit<ChallengeHistoryEntry, 'id' | 'createdAt'> & { createdAt: any } = {
      userId: user.uid,
      topic: initialTopic,
      difficulty: initialDifficulty,
      questionType: activeDisplayType,
      question: currentDisplayedQuestion,
      userSolution: userSolution,
      gradingResult: currentGradingResult,
      generatedSolution: solutionOutput, 
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "challengeHistory"), historyEntryData);
      console.log("[SAVE_HISTORY_SUCCESS] Challenge history saved with ID: ", docRef.id);
      toast({ title: "Challenge Saved!", description: "Your attempt has been successfully saved to your history." });
      
      // After saving, check for achievements
      // We need to create a temporary ChallengeHistoryEntry object with the Timestamp resolved for checkAndAwardAchievements
      // Firestore typically returns serverTimestamp() as null on the client immediately after write,
      // so we use a client-side current date for the purpose of achievement checking.
      // The actual 'createdAt' in DB will be the server's timestamp.
      const tempHistoryEntryForAchievementCheck: ChallengeHistoryEntry = {
        ...historyEntryData,
        id: docRef.id,
        createdAt: Timestamp.now() // Use client-side timestamp for immediate check
      };
      if (currentGradingResult.passed) {
        await checkAndAwardAchievements(user.uid, tempHistoryEntryForAchievementCheck);
      }

    } catch (e) {
      console.error("[SAVE_HISTORY_FIRESTORE_ERROR] Error adding document to Firestore: ", e);
      let errorMessage = "Could not save your attempt to history. Please check console for details.";
      if (e instanceof Error && (e.message.toLowerCase().includes("missing or insufficient permissions") || e.message.toLowerCase().includes("permission_denied"))) {
        errorMessage = "History save failed due to Firestore permission issues. Please check your security rules.";
      }
      toast({ variant: "destructive", title: "History Save Error", description: errorMessage });
    }
  };

  const handleSubmitChallenge = async () => {
    if (!initialTopic || !initialDifficulty || !activeDisplayType || !currentDisplayedQuestion) {
      setError("Missing information to grade. Ensure topic, difficulty, and question type are set.");
      toast({ variant: "destructive", title: "Error", description: "Cannot submit: Missing critical information." });
      return;
    }

    const currentUserSolution = activeDisplayType === "coding" ? code : conceptualAnswer;

    if (activeDisplayType === "coding" && !currentUserSolution.trim()) {
      setError("Code editor is empty. Please write your code before submitting.");
      toast({ variant: "destructive", title: "Error", description: "Cannot submit: Code is empty." });
      return;
    }

    if (activeDisplayType === "conceptual" && !currentUserSolution.trim()) {
      setError("Answer field is empty. Please write your answer before submitting.");
      toast({ variant: "destructive", title: "Error", description: "Cannot submit: Answer is empty." });
      return;
    }

    setIsSubmittingChallenge(true);
    setGradingResult(null);
    setGeneratedSolution(null); 
    setSolutionError(null);
    setError(null);

    let finalGradingResult: GradeCodeOutput | AnswerGradingOutput | null = null;
    let finalGeneratedSolution: SolutionGenerationOutput | null = null;

    try {
      if (activeDisplayType === "coding") {
        const gradingInput: GradeCodeInput = { code: currentUserSolution, topic: initialTopic, difficulty: initialDifficulty };
        finalGradingResult = await gradeCode(gradingInput);
      } else { 
        const gradingInput: AnswerGradingInput = { userAnswer: currentUserSolution, question: currentDisplayedQuestion, topic: initialTopic, difficulty: initialDifficulty };
        finalGradingResult = await gradeAnswer(gradingInput);
      }
      setGradingResult(finalGradingResult);
      toast({ title: "Grading Complete!", description: finalGradingResult.passed ? "Congratulations, you passed!" : "Keep practicing!", className: finalGradingResult.passed ? "bg-green-500 text-white" : "bg-red-500 text-white" });
      
      if (!finalGradingResult.passed) {
        setIsLoadingSolution(true);
        setSolutionError(null);
        try {
          const solutionInput: SolutionGenerationInput = {
            topic: initialTopic,
            difficulty: initialDifficulty,
            question: currentDisplayedQuestion,
            questionType: activeDisplayType,
          };
          finalGeneratedSolution = await generateSolution(solutionInput);
          setGeneratedSolution(finalGeneratedSolution);
          toast({ title: "Solution Generated", description: "The solution is now available below."});
        } catch (err) {
          console.error("Error generating solution:", err);
          setSolutionError("Failed to generate solution. Please try again.");
          toast({ variant: "destructive", title: "Solution Error", description: "Could not generate the solution."});
        } finally {
          setIsLoadingSolution(false);
        }
      }
      
      if (user) {
        console.log("[SUBMIT_CHALLENGE] Attempt complete. Proceeding to save history.");
        await saveChallengeToHistory(finalGradingResult, currentUserSolution, finalGeneratedSolution);
      } else {
        console.log("[SUBMIT_CHALLENGE] User not logged in. History will not be saved.");
      }

    } catch (submissionError) {
      console.error(`Error grading ${activeDisplayType} challenge:`, submissionError);
      setError(`Failed to grade ${activeDisplayType} challenge. Please try again.`);
      toast({ variant: "destructive", title: "Error", description: `Failed to grade your ${activeDisplayType} challenge.` });
    } finally {
      setIsSubmittingChallenge(false);
    }
  };


  const handleRestartChallenge = () => {
    if (initialTopic && initialDifficulty && initialPreference) {
      fetchQuestionForChallenge(initialTopic, initialDifficulty, initialPreference);
    }
  };

  const handleSwitchActiveDisplayType = (newType: ActiveDisplayType) => {
    resetChallengeState(false); 
    setActiveDisplayType(newType);
  };
  
  const isInputDisabled = !initialTopic?.trim() || !currentDisplayedQuestion || isLoadingQuestion || isSubmittingChallenge || isLoadingSolution;
  const isSelectorDisabled = isLoadingQuestion || isSubmittingChallenge || isLoadingSolution;

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Verifying authentication...</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (hasValidParams === null && !authLoading && user) { 
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading challenge parameters...</p>
        </main>
        <AppFooter />
      </div>
    );
  }
  
  if (!hasValidParams && !authLoading && user) { 
     return (
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {error || "Challenge parameters are missing. Please return to the dashboard to set up your challenge."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/')} className="mt-6">
            <Home className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
        </main>
        <AppFooter />
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
           <h1 className="text-2xl font-headline">Your Challenge</h1>
           <div className="flex gap-2">
            <Button onClick={handleRestartChallenge} variant="outline" disabled={isSelectorDisabled}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restart This Challenge
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" disabled={isSelectorDisabled && !isLoadingQuestion}>
              <Home className="mr-2 h-4 w-4" /> New Challenge (Dashboard)
            </Button>
           </div>
        </div>

        {error && !isLoadingQuestion && (
          <Alert variant="destructive" className="transition-all animate-in fade-in-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {challengeData?.questionTypeGenerated === 'both' && (
          <div className="flex justify-center gap-4 my-4">
            <Button
              variant={activeDisplayType === 'coding' ? 'default' : 'outline'}
              onClick={() => handleSwitchActiveDisplayType('coding')}
              disabled={isSelectorDisabled}
            >
              <Code className="mr-2 h-4 w-4" />
              Coding Challenge
            </Button>
            <Button
              variant={activeDisplayType === 'conceptual' ? 'default' : 'outline'}
              onClick={() => handleSwitchActiveDisplayType('conceptual')}
              disabled={isSelectorDisabled}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Conceptual Question
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section aria-labelledby="challenge-heading">
            <h2 id="challenge-heading" className="sr-only">Challenge Details</h2>
            <ChallengeDisplay
              topic={initialTopic}
              question={currentDisplayedQuestion}
              questionType={activeDisplayType} 
              isLoadingQuestion={isLoadingQuestion}
              questionHint={currentDisplayedHint}
              isQuestionAvailable={!!currentDisplayedQuestion && !!initialTopic && !!initialDifficulty}
            />
          </section>
          
          <div className="space-y-8">
            {activeDisplayType === "coding" && challengeData && (challengeData.codingQuestion || isLoadingQuestion) && (
              <section aria-labelledby="editor-heading">
                <h2 id="editor-heading" className="sr-only">Code Editor</h2>
                <CodeEditorPanel
                  code={code}
                  onCodeChange={setCode}
                  onSubmit={handleSubmitChallenge}
                  isSubmitting={isSubmittingChallenge}
                  disabled={isInputDisabled || !challengeData?.codingQuestion}
                />
              </section>
            )}

            {activeDisplayType === "conceptual" && challengeData && (challengeData.conceptualQuestion || isLoadingQuestion) && (
               <section aria-labelledby="answer-heading">
                <h2 id="answer-heading" className="sr-only">Conceptual Answer</h2>
                <ConceptualAnswerPanel
                  answer={conceptualAnswer}
                  onAnswerChange={setConceptualAnswer}
                  onSubmit={handleSubmitChallenge}
                  isSubmitting={isSubmittingChallenge}
                  disabled={isInputDisabled || !challengeData?.conceptualQuestion}
                />
              </section>
            )}
            
            {activeDisplayType && challengeData && (currentDisplayedQuestion || isLoadingQuestion) && (
              <section aria-labelledby="feedback-heading">
                <h2 id="feedback-heading" className="sr-only">Grading Feedback</h2>
                <GradingResults
                  result={gradingResult}
                  isLoading={isSubmittingChallenge || (gradingResult && !gradingResult.passed && isLoadingSolution)}
                  generatedSolution={generatedSolution}
                  isLoadingSolution={isLoadingSolution} 
                  solutionError={solutionError}
                  questionType={activeDisplayType}
                />
              </section>
            )}
             {!currentDisplayedQuestion && !isLoadingQuestion && initialTopic && (
                <div className="text-center py-10">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg text-muted-foreground">Generating your challenge for {initialTopic}...</p>
                </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading Challenge...</p>
        </main>
        <AppFooter />
      </div>
    }>
      <ChallengePageContent />
    </Suspense>
  )
}
