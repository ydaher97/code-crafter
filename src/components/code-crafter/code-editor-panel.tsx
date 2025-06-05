
"use client";

import type { FC, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, FileCode, Copy, Eraser } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export const CodeEditorPanel: FC<CodeEditorPanelProps> = ({
  code,
  onCodeChange,
  onSubmit,
  isSubmitting,
  disabled,
}) => {
  const { toast } = useToast();

  const handleCodeInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onCodeChange(event.target.value);
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code Copied!",
        description: "Your code has been copied to the clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy code: ", err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy code to clipboard.",
      });
    }
  };

  const handleClearCode = () => {
    onCodeChange("");
    toast({
      title: "Code Cleared",
      description: "The editor content has been cleared.",
    });
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl flex items-center">
          <FileCode className="mr-2 h-6 w-6 text-primary" /> Code Editor
        </CardTitle>
        <TooltipProvider>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  disabled={!code.trim() || disabled || isSubmitting}
                  aria-label="Copy code"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Code</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearCode}
                  disabled={!code.trim() || disabled || isSubmitting}
                  aria-label="Clear code"
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Code</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex-grow">
        <Textarea
          value={code}
          onChange={handleCodeInputChange}
          placeholder={disabled ? "Please select a difficulty and generate a challenge first." : "Write your code here..."}
          className="h-full min-h-[200px] font-code text-sm resize-y"
          disabled={disabled || isSubmitting}
          aria-label="Code Editor"
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSubmit}
          disabled={disabled || isSubmitting || !code.trim()}
          className="w-full transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Grading..." : "Submit Code"}
        </Button>
      </CardFooter>
    </Card>
  );
};
