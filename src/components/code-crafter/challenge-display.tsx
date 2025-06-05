
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, HelpCircle, Puzzle, BookOpen } from "lucide-react";

type ActiveDisplayType = "coding" | "conceptual" | null;

interface ChallengeDisplayProps {
  topic: string | null;
  question: string | null; // This will be the question for the activeDisplayType
  questionType: ActiveDisplayType; // This is the active type being displayed
  isLoadingQuestion: boolean;
  questionHint: string | null; // Hint for the active question
  isQuestionAvailable: boolean;
}

export const ChallengeDisplay: FC<ChallengeDisplayProps> = ({
  topic,
  question,
  questionType, // Renamed from activeDisplayType for clarity within this component
  isLoadingQuestion,
  questionHint,
  isQuestionAvailable,
}) => {
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

        {isQuestionAvailable && questionHint && !isLoadingQuestion && (
          <div className="mt-4 pt-4 border-t border-border">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="hint">
                <AccordionTrigger className="text-accent hover:text-accent/90 font-semibold text-base">
                  <Lightbulb className="mr-2 h-5 w-5" /> Show Hint
                </AccordionTrigger>
                <AccordionContent className="pt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                  {questionHint}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
         {!isLoadingQuestion && !question && !topic &&(
            <CardDescription className="text-base text-muted-foreground pt-4 border-t mt-4">
              Please make your selections above to start your learning journey!
            </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};
