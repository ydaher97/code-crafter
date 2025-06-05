
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookMarked, Check, Wand2, Loader2 } from 'lucide-react';
import { generateTopic, type TopicGenerationInput } from '@/ai/flows/topic-generation';
import { useToast } from "@/hooks/use-toast";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface TopicSelectorProps {
  currentTopic: string | null;
  onTopicChange: (topic: string) => void;
  selectedDifficulty: Difficulty | null; // New prop
  disabled: boolean;
}

const PREDEFINED_TOPICS = [
  "JavaScript Variables", "Python Lists", "React Props", "CSS Selectors", "HTML Attributes",
  "JavaScript Functions", "Python Dictionaries", "React State Management", "CSS Grid Layout",
  "Data Structures: Arrays", "Algorithms: Bubble Sort",
];
const OTHER_TOPIC_VALUE = "__other__";

export const TopicSelector: FC<TopicSelectorProps> = ({
  currentTopic,
  onTopicChange,
  selectedDifficulty,
  disabled,
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customTopicDraft, setCustomTopicDraft] = useState<string>("");
  const [isSuggestingTopic, setIsSuggestingTopic] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const initiallyCustom = !!currentTopic && !PREDEFINED_TOPICS.includes(currentTopic);
    setIsCustomMode(initiallyCustom);
    if (initiallyCustom) {
      setCustomTopicDraft(currentTopic || "");
    } else if (!currentTopic && !isCustomMode) {
      setCustomTopicDraft("");
    }
  }, [currentTopic]);


  const handleSelectChange = (value: string) => {
    if (value === OTHER_TOPIC_VALUE) {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      setCustomTopicDraft("");
      onTopicChange(value);
    }
  };

  const handleCustomInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTopicDraft(event.target.value);
  };

  const handleConfirmCustomTopic = () => {
    if (customTopicDraft.trim()) {
      onTopicChange(customTopicDraft.trim());
    }
  };

  const handleSuggestTopic = async () => {
    if (!selectedDifficulty) {
      toast({
        variant: "destructive",
        title: "Suggestion Error",
        description: "Please select a difficulty level first to get a topic suggestion.",
      });
      return;
    }
    setIsSuggestingTopic(true);
    try {
      const input: TopicGenerationInput = { difficulty: selectedDifficulty };
      const result = await generateTopic(input);
      if (result.topic) {
        onTopicChange(result.topic);
        setCustomTopicDraft(result.topic); // Also update draft for custom mode
        setIsCustomMode(true); // Switch to custom mode to show the suggested topic
        toast({
          title: "Topic Suggested!",
          description: `AI suggested: "${result.topic}"`,
        });
      } else {
        throw new Error("AI did not return a topic.");
      }
    } catch (error) {
      console.error("Error suggesting topic:", error);
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: "Could not get a topic suggestion from AI. Please try again or enter manually.",
      });
    } finally {
      setIsSuggestingTopic(false);
    }
  };

  let dropdownDisplayValue: string | undefined;
  if (isCustomMode) {
    dropdownDisplayValue = OTHER_TOPIC_VALUE;
  } else if (currentTopic && PREDEFINED_TOPICS.includes(currentTopic)) {
    dropdownDisplayValue = currentTopic;
  } else {
    dropdownDisplayValue = undefined;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <BookMarked className="mr-2 h-6 w-6 text-primary" /> Choose or Define a Topic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-grow">
            <Label htmlFor="topic-select" className="mb-1 block">Select a topic or get a suggestion</Label>
            <Select
              value={dropdownDisplayValue}
              onValueChange={handleSelectChange}
              disabled={disabled || isSuggestingTopic}
              name="topic-select"
            >
              <SelectTrigger id="topic-select" aria-label="Select a topic" className="w-full">
                <SelectValue placeholder="Select or type a topic..." />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_TOPIC_VALUE}>Other (Specify below / Get Suggestion)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSuggestTopic}
            disabled={disabled || !selectedDifficulty || isSuggestingTopic}
            variant="outline"
            className="w-full sm:w-auto"
            aria-label="Suggest a topic"
          >
            {isSuggestingTopic ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Suggest Topic
          </Button>
        </div>

        {isCustomMode && (
          <div className="animate-in fade-in-50 duration-300 space-y-2 pt-2 border-t">
             <Label htmlFor="custom-topic-input" className="mb-1 block">Enter or confirm topic</Label>
            <div className="flex gap-2">
              <Input
                id="custom-topic-input"
                type="text"
                placeholder="e.g., Advanced React Hooks"
                value={customTopicDraft}
                onChange={handleCustomInputChange}
                disabled={disabled || isSuggestingTopic}
                aria-label="Custom topic input"
                className="flex-grow"
              />
              <Button
                onClick={handleConfirmCustomTopic}
                disabled={disabled || !customTopicDraft.trim() || isSuggestingTopic}
                aria-label="Set custom topic"
                variant="secondary"
              >
                <Check className="mr-2 h-4 w-4" />
                Set
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
