export type ExpenseCategory =
  | 'Food' | 'Drink' | 'Rickshaw' | 'Railway' | 'Flight'
  | 'Stay' | 'Water' | 'Entry Fee' | 'Shopping' | 'Other';

export interface Member {
  id: string;
  name: string;
  isCreator: boolean;
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

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  members: Member[];
  expenses: Expense[];
  creatorId: string;
}

// --- THIS IS THE MISSING PART CAUSING THE CRASH ---
export interface Debt {
  from: string;
  to: string;
  amount: number;
}