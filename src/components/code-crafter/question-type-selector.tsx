
"use client";

import type { FC } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, HelpCircle, Rows } from 'lucide-react'; // Updated icons

export type QuestionTypePreference = "coding" | "conceptual" | "both";

interface QuestionTypeSelectorProps {
  selectedPreference: QuestionTypePreference;
  onPreferenceChange: (preference: QuestionTypePreference) => void;
  disabled: boolean;
}

const preferences: { value: QuestionTypePreference; label: string; icon: React.ReactNode }[] = [
  { value: "coding", label: "Coding Only", icon: <Code2 className="mr-0 sm:mr-2 h-5 w-5" /> },
  { value: "conceptual", label: "Conceptual Only", icon: <HelpCircle className="mr-0 sm:mr-2 h-5 w-5" /> },
  { value: "both", label: "Both Types", icon: <Rows className="mr-0 sm:mr-2 h-5 w-5" /> },
];

export const QuestionTypeSelector: FC<QuestionTypeSelectorProps> = ({
  selectedPreference,
  onPreferenceChange,
  disabled,
}) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Question Type</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedPreference}
          onValueChange={(value) => onPreferenceChange(value as QuestionTypePreference)}
          className="grid grid-cols-3 gap-2 sm:gap-4" // Adjusted for smaller screens
          disabled={disabled}
        >
          {preferences.map((pref) => (
            <Label
              key={pref.value}
              htmlFor={`preference-${pref.value}`}
              className={`flex flex-col items-center justify-center rounded-md border-2 p-3 sm:p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors
                ${selectedPreference === pref.value ? "border-primary ring-2 ring-primary" : "border-muted"}
                ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <RadioGroupItem value={pref.value} id={`preference-${pref.value}`} className="sr-only" />
              {pref.icon}
              <span className="text-xs sm:text-sm font-medium text-center mt-1 sm:mt-2">{pref.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
