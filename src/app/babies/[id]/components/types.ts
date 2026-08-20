export interface Parent {
  _id: string;
  name: string;
  phone: string;
}

export interface Doctor {
  _id: string;
  name: string;
  email?: string;
}

export interface Baby {
  _id: string;
  name: string;
  ageInMonths: number;
  weight?: number;
  allergies: string[];
  diet?: string;
  parentId: Parent;
  assignedDoctorId?: Doctor;
  isActive: boolean;
  createdAt: string;
  gender?: 'boy' | 'girl' | 'private';
  dateOfBirth?: string;
}

export interface GrowthRecord {
  _id: string;
  weight: number;
  height: number;
  headCircumference?: number;
  notes: string;
  createdAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  dateAchieved: string;
  notes: string;
}

export interface Meal {
  _id: string;
  name: string;
  imageUrl?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
}

export interface ScheduleItem {
  _id?: string;
  day: string;
  mealId: Meal | string;
}

export interface NutritionPlan {
  _id: string;
  guidelines: string;
  weeklySchedule?: ScheduleItem[];
  assignedBy?: Doctor;
  createdAt: string;
}

export interface Prescription {
  _id: string;
  babyId?: {
    _id: string;
    name: string;
    parentId?: { _id: string; name: string; avatar?: string };
  };
  doctorId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  uploadedByParent?: boolean;
  fileUrl: string;
  medicalNotes: string;
  nutritionRecommendations: string;
  medicines?: {
    _id?: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  vitals?: {
    weight: string;
    temperature: string;
    bp: string;
  };
  nextVisitDate?: string;
  createdAt: string;
}
