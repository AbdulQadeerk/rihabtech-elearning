// Course Card Component
export interface Course {
    id: number;
    title: string;
    description: string;
    students: number;
    duration: number;
    progress?: number;
    price?: number;
    originalPrice?: number;
    image: string;
  }