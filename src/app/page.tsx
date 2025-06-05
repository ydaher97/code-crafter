
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { DifficultySelector } from "@/components/code-crafter/difficulty-selector";
import { TopicSelector } from "@/components/code-crafter/topic-selector";
import { QuestionTypeSelector, type QuestionTypePreference } from "@/components/code-crafter/question-type-selector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export default function DashboardPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionTypePreference, setQuestionTypePreference] = useState<QuestionTypePreference>("both");
  const [isStartingChallenge, setIsStartingChallenge] = useState<boolean>(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleStartChallenge = useCallback(async () => {
    if (!difficulty || !selectedTopic?.trim() || !questionTypePreference) {
      toast({
        variant: "destructive",
        title: "Missing Selections",
        description: "Please select a difficulty, topic, and question type preference before starting.",
      });
      return;
    }

    setIsStartingChallenge(true);

    const queryParams = new URLSearchParams({
      difficulty,
      topic: selectedTopic,
      type: questionTypePreference,
    });

    try {
      await router.push(`/challenge?${queryParams.toString()}`);
    } catch (error) {
      console.error("Failed to navigate:", error);
      toast({
        variant: "destructive",
        title: "Navigation Error",
        description: "Could not start the challenge. Please try again.",
      });
      setIsStartingChallenge(false);
    }

  }, [difficulty, selectedTopic, questionTypePreference, router, toast]);

  const isFormIncomplete = !difficulty || !selectedTopic?.trim() || !questionTypePreference;

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Welcome to CodeCrafter!</CardTitle>
            <CardDescription className="text-lg">
              Configure your learning challenge below and put your skills to the test.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-6">
              <DifficultySelector
                selectedDifficulty={difficulty}
                onDifficultyChange={(newDifficulty) => {
                  setDifficulty(newDifficulty);
                  // Optionally reset topic if difficulty changes, or let user decide.
                  // setSelectedTopic(null); 
                }}
                disabled={isStartingChallenge} 
              />
              <TopicSelector
                currentTopic={selectedTopic}
                onTopicChange={setSelectedTopic}
                selectedDifficulty={difficulty} // Pass selected difficulty
                disabled={isStartingChallenge}
              />
              <QuestionTypeSelector
                selectedPreference={questionTypePreference}
                onPreferenceChange={setQuestionTypePreference}
                disabled={isStartingChallenge}
              />
            </div>
            <Button
              onClick={handleStartChallenge}
              disabled={isFormIncomplete || isStartingChallenge}
              className="w-full text-lg py-6 mt-4"
              size="lg"
            >
              {isStartingChallenge ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              {isStartingChallenge ? "Starting..." : "Start Challenge"}
            </Button>
             {(isFormIncomplete && !isStartingChallenge) && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Please fill in all options to start your challenge.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
