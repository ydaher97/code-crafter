
import type { Timestamp } from "firebase/firestore";

export interface Achievement {
  id: string; 
  name: string;
  description: string;
  iconName: string; // Corresponds to a Lucide icon name
  criteriaCount?: number; 
  criteriaDifficulty?: "Beginner" | "Intermediate" | "Advanced";
}

export interface UserAchievement extends Achievement {
  userId: string;
  earnedAt: Timestamp;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'initiate_programmer',
    name: "Initiate Programmer",
    description: "Successfully passed your first challenge!",
    iconName: "Award",
  },
  {
    id: 'beginner_challenger_3',
    name: "Beginner Challenger",
    description: "Passed 3 challenges at Beginner difficulty.",
    iconName: "Star",
    criteriaCount: 3,
    criteriaDifficulty: "Beginner",
  },
  {
    id: 'intermediate_adept_3',
    name: "Intermediate Adept",
    description: "Passed 3 challenges at Intermediate difficulty.",
    iconName: "ShieldCheck",
    criteriaCount: 3,
    criteriaDifficulty: "Intermediate",
  },
  {
    id: 'advanced_virtuoso_3',
    name: "Advanced Virtuoso",
    description: "Passed 3 challenges at Advanced difficulty.",
    iconName: "Gem",
    criteriaCount: 3,
    criteriaDifficulty: "Advanced",
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS_LIST.find(ach => ach.id === id);
};
