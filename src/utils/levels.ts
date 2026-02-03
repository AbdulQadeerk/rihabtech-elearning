export interface Level {
  value: string;
  label: string;
}

export interface IDicMapping {
  [key: string]: string;
}

export const LEVELS: Level[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
  { value: "all", label: "All Levels" }
];

export const LevelsObj: IDicMapping = {
  "beginner": "Beginner",
  "intermediate": "Intermediate",
  "expert": "Expert",
  "all": "All Levels"
};

// Helper function to get level label from value
export const getLevelLabel = (value?: string | null): string => {
  if (!value) return "";
  // Use LevelsObj for direct lookup
  return LevelsObj[value.toLowerCase()] || value;
};

