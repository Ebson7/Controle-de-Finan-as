export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string; // YYYY-MM-DD
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paid: boolean;
  recurring: boolean;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface AIInsights {
  summary: string;
  financialHealthScore: number;
  tips: {
    title: string;
    description: string;
    category: "Economia" | "Alerta" | "Planejamento" | "Investimento";
  }[];
  categoryAnalysis: {
    category: string;
    comment: string;
    status: "good" | "warning" | "critical";
  }[];
}
