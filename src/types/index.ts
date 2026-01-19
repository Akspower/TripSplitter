export type ExpenseCategory =
  | 'Food' | 'Drink' | 'Cab/Taxi' | 'Train/Bus/Flight'
  | 'Hotel/Stay' | 'Entry Fee' | 'Shopping' | 'Trekking Gear' | 'Alcohol' | 'Other';

export interface Member {
  id: string;
  name: string;
  isCreator: boolean;
  avatarColor?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  payerId: string;
  participantIds: string[];
  createdBy?: string;
}

export type TripStyle = 'adventure' | 'relaxed' | 'budget' | 'luxury';
export type BudgetType = 'backpacker' | 'moderate' | 'splurge';
export type AgeGroup = 'youth' | 'mixed' | 'family' | 'seniors';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  members: Member[];
  expenses: Expense[];
  creatorId: string;
  adminPin?: string;
  tripStyle?: TripStyle;
  budgetType?: BudgetType;
  ageGroup?: AgeGroup;
}

// --- THIS IS THE MISSING PART CAUSING THE CRASH ---
export interface Debt {
  from: string;
  to: string;
  amount: number;
}