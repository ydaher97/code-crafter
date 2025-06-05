
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, Star, MessageSquare, Lightbulb, Loader2, AlertCircle, BookOpen, Code } from "lucide-react";
import type { GradeCodeOutput } from '@/ai/flows/code-grading';
import type { AnswerGradingOutput } from '@/ai/flows/answer-grading';
import type { SolutionGenerationOutput } from '@/ai/flows/solution-generation';
import { Alert, AlertDescription, AlertTitle as AlertTitleUi } from "@/components/ui/alert";

type ActiveDisplayType = "coding" | "conceptual" | null;

interface GradingResultsProps {
  result: GradeCodeOutput | AnswerGradingOutput | null;
  isLoading: boolean; // Loading grading or subsequent solution generation
  generatedSolution: SolutionGenerationOutput | null;
  isLoadingSolution: boolean; // Specifically for solution loading part AFTER grading
  solutionError: string | null;
  questionType: ActiveDisplayType;
}

export const GradingResults: FC<GradingResultsProps> = ({
  result,
  isLoading, // This now covers grading + immediate solution fetching if failed
  generatedSolution,
  isLoadingSolution, // Use this to show loader specifically for solution part
  solutionError,
  questionType
}) => {

  if (isLoading && !result) { // Only show grading skeleton if grading is in progress
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
             <Star className="mr-2 h-6 w-6 text-primary" /> AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!result) { // No result yet, not loading grading
    return (
       <Card className="shadow-lg border-dashed border-muted">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-muted-foreground flex items-center">
             <Star className="mr-2 h-6 w-6 text-muted-foreground" /> AI Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Submit your {questionType === 'coding' ? 'code' : 'answer'} to see the grading results.</p>
        </CardContent>
      </Card>
    );
  }

  // Result is available
  return (
    <Card className={`shadow-lg transition-all ${result.passed ? 'border-green-500' : 'border-red-500'}`}>
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Star className="mr-2 h-6 w-6 text-primary" /> AI Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-lg font-semibold">Score: {result.score}/100</p>
            <Badge variant={result.passed ? "default" : "destructive"} className={result.passed ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
              {result.passed ? (
                <CheckCircle2 className="mr-1 h-4 w-4" />
              ) : (
                <XCircle className="mr-1 h-4 w-4" />
              )}
              {result.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
        </div>
        <div>
          <h4 className="text-md font-semibold mb-1 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-accent"/>
            Feedback:
          </h4>
          <CardDescription className="text-base whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{result.feedback}</CardDescription>
        </div>
      </CardContent>

      {/* Solution Section - shown if failed and solution is available or loading */}
      {result && !result.passed && (isLoadingSolution || generatedSolution || solutionError) && (
        <CardContent className="pt-4 mt-4 border-t border-border space-y-3">
          <h4 className="text-md font-semibold mb-1 flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-accent"/>
            Suggested Solution
          </h4>
          {isLoadingSolution && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Generating solution, please wait...</span>
            </div>
          )}
          {solutionError && !isLoadingSolution && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitleUi>Solution Error</AlertTitleUi>
              <AlertDescription>{solutionError}</AlertDescription>
            </Alert>
          )}
          {generatedSolution && !isLoadingSolution && (
            <Accordion type="single" collapsible className="w-full" defaultValue="solution-item">
              <AccordionItem value="solution-item">
                <AccordionTrigger className="text-accent hover:text-accent/90 font-semibold text-base">
                  {questionType === 'coding' ? <Code className="mr-2 h-5 w-5" /> : <BookOpen className="mr-2 h-5 w-5" />}
                  View Generated Solution
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-4">
                  <div>
                    <h5 className="font-semibold mb-1">Solution:</h5>
                    {questionType === 'coding' ? (
                       <pre className="bg-muted/70 p-3 rounded-md text-sm overflow-x-auto font-code max-h-96"><code>{generatedSolution.solution}</code></pre>
                    ) : (
                       <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{generatedSolution.solution}</p>
                    )}
                  </div>
                  <div>
                    <h5 className="font-semibold mb-1">Explanation:</h5>
                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">{generatedSolution.explanation}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      )}
    </Card>
  );
};

