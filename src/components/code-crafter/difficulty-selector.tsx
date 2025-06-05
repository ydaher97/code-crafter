"use client";

import type { FC } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty | null;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled: boolean;
}

const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export const DifficultySelector: FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onDifficultyChange,
  disabled,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Choose Your Challenge Level</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedDifficulty ?? ""}
          onValueChange={(value) => onDifficultyChange(value as Difficulty)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          disabled={disabled}
        >
          {difficulties.map((difficulty) => (
            <Label
              key={difficulty}
              htmlFor={`difficulty-${difficulty}`}
              className={`flex flex-col items-center justify-center rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors
                ${selectedDifficulty === difficulty ? "border-primary ring-2 ring-primary" : "border-muted"}
                ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <RadioGroupItem value={difficulty} id={`difficulty-${difficulty}`} className="sr-only" />
              <span className="text-lg font-medium">{difficulty}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
