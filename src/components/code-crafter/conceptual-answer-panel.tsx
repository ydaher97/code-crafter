
"use client";

import type { FC, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare, Eraser, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConceptualAnswerPanelProps {
  answer: string;
  onAnswerChange: (newAnswer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
  placeholder?: string;
}

export const ConceptualAnswerPanel: FC<ConceptualAnswerPanelProps> = ({
  answer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  disabled,
  placeholder = "Write your answer here...",
}) => {
  const { toast } = useToast();

  const handleAnswerInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(event.target.value);
  };

  const handleCopyAnswer = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      toast({
        title: "Answer Copied!",
        description: "Your answer has been copied to the clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy answer: ", err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy answer to clipboard.",
      });
    }
  };

  const handleClearAnswer = () => {
    onAnswerChange("");
    toast({
      title: "Answer Cleared",
      description: "The answer field has been cleared.",
    });
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl flex items-center">
          <MessageSquare className="mr-2 h-6 w-6 text-primary" /> Your Answer
        </CardTitle>
        <TooltipProvider>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyAnswer}
                  disabled={!answer.trim() || disabled || isSubmitting}
                  aria-label="Copy answer"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Answer</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAnswer}
                  disabled={!answer.trim() || disabled || isSubmitting}
                  aria-label="Clear answer"
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Answer</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex-grow">
        <Textarea
          value={answer}
          onChange={handleAnswerInputChange}
          placeholder={disabled ? "Please select a difficulty and generate a challenge first." : placeholder}
          className="h-full min-h-[200px] font-body text-sm resize-y" // Using font-body for conceptual answers
          disabled={disabled || isSubmitting}
          aria-label="Conceptual Answer Input"
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSubmit}
          disabled={disabled || isSubmitting || !answer.trim()}
          className="w-full transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Grading..." : "Submit Answer"}
        </Button>
      </CardFooter>
    </Card>
  );
};
