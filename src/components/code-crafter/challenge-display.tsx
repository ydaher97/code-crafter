"use client";

import { type FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, HelpCircle, Puzzle, BookOpen, ChevronDown } from "lucide-react";

type ActiveDisplayType = "coding" | "conceptual" | null;

interface ChallengeDisplayProps {
  topic: string | null;
  question: string | null; // This will be the question for the activeDisplayType
  questionType: ActiveDisplayType; // This is the active type being displayed
  isLoadingQuestion: boolean;
  questionHints: string[] | null; // Hint for the active question
  isQuestionAvailable: boolean;
}

export const ChallengeDisplay: FC<ChallengeDisplayProps> = ({
  topic,
  question,
  questionType, 
  isLoadingQuestion,
  questionHints,
  isQuestionAvailable,
}) => {
  const [revealedHintCount, setRevealedHintCount] = useState(0);

  useEffect(() => {
    // Reset revealed hints when the question (or hints) change
    setRevealedHintCount(0);
  }, [questionHints]);

  const handleRevealNextHint = () => {
    if (questionHints && revealedHintCount < questionHints.length) {
      setRevealedHintCount(prevCount => prevCount + 1);
    }
  };

  const totalHints = questionHints?.length || 0;
  const canRevealMoreHints = totalHints > 0 && revealedHintCount < totalHints;

  const getTitleIcon = () => {
    if (questionType === 'coding') return <Puzzle className="mr-2 h-6 w-6 text-primary" />;
    if (questionType === 'conceptual') return <BookOpen className="mr-2 h-6 w-6 text-primary" />;
    return <Lightbulb className="mr-2 h-6 w-6 text-primary" />;
  };

  const getTitleText = () => {
    if (questionType === 'coding') return 'Your Coding Challenge';
    if (questionType === 'conceptual') return 'Your Conceptual Question';
    return 'Your Challenge';
  };


  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          {getTitleIcon()} {getTitleText()}
        </CardTitle>
          {questionType && !isLoadingQuestion && (
            <Badge variant="outline" className="w-fit mt-1">
              {questionType === 'coding' ? 'Type: Coding' : 'Type: Conceptual'}
            </Badge>
          )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
             <HelpCircle className="mr-2 h-5 w-5 text-accent" /> Topic:
          </h3>
          {isLoadingQuestion && !topic && !question ? ( <Skeleton className="h-5 w-3/4" /> ) 
          : topic ? (
            <CardDescription className="text-base">{topic}</CardDescription>
          ) : (
            <CardDescription className="text-base text-muted-foreground">Select difficulty, topic, and preference to generate a challenge.</CardDescription>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <HelpCircle className="mr-2 h-5 w-5 text-accent" /> Question:
          </h3>
          {isLoadingQuestion ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          ) : question ? (
            <CardDescription className="text-base whitespace-pre-wrap">{question}</CardDescription>
          ) : topic && topic.trim() ? ( 
             <CardDescription className="text-base text-muted-foreground">Generating question(s) for "{topic}"...</CardDescription>
          ) : (
            <CardDescription className="text-base text-muted-foreground">Select settings above to see a question.</CardDescription>
          )}
        </div>

        {isQuestionAvailable && questionHints && questionHints.length > 0 && !isLoadingQuestion && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <h4 className="text-md font-semibold flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-accent"/>
              Hints ({revealedHintCount}/{totalHints} revealed)
            </h4>
            {revealedHintCount > 0 && (
              <div className="space-y-2">
                {questionHints.slice(0, revealedHintCount).map((hint, index) => (
                  <div key={index} className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap animate-in fade-in-50">
                    <strong>Hint {index + 1}:</strong> {hint}
                  </div>
                ))}
              </div>
            )}
            {canRevealMoreHints && (
              <Button onClick={handleRevealNextHint} variant="outline" size="sm">
                <ChevronDown className="mr-2 h-4 w-4" />
                Reveal Next Hint ({revealedHintCount + 1}/{totalHints})
              </Button>
            )}
            {!canRevealMoreHints && revealedHintCount > 0 && (
                <p className="text-sm text-muted-foreground">All hints revealed.</p>
            )}
          </div>
        )}
        {!isLoadingQuestion && !question && !topic && (
          <CardDescription className="text-base text-muted-foreground pt-4 border-t mt-4">
            Please make your selections above to start your learning journey!
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};
