import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  CalendarRange, 
  Target, 
  Database,
  Coins,
  DollarSign
} from "lucide-react";
import { Transaction, Bill, CategoryBudget } from "./types";
import Dashboard from "./components/Dashboard";
import TransactionsManager from "./components/TransactionsManager";
import BillsManager from "./components/BillsManager";
import BudgetPlanner from "./components/BudgetPlanner";
import DatabaseQuery from "./components/DatabaseQuery";

// Default starter data
const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: "t1", description: "Salário Mensal", amount: 5500.00, type: "income", category: "Salário", date: new Date().toISOString().split('T')[0] },
  { id: "t2", description: "Supermercado Carrefour", amount: 480.50, type: "expense", category: "Alimentação", date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
  { id: "t3", description: "Posto Shell Combustível", amount: 180.00, type: "expense", category: "Transporte", date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
  { id: "t4", description: "Jantar Pizzaria", amount: 120.00, type: "expense", category: "Lazer", date: new Date().toISOString().split('T')[0] },
  { id: "t5", description: "Internet Banda Larga", amount: 120.00, type: "expense", category: "Moradia", date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] }
];

const DEFAULT_BILLS: Bill[] = [
  { id: "b1", name: "Aluguel", amount: 1500.00, dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], paid: false, recurring: true },
  { id: "b2", name: "Conta de Energia Coelba", amount: 220.50, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], paid: false, recurring: true },
  { id: "b3", name: "Assinatura Netflix", amount: 55.90, dueDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0], paid: false, recurring: true },
  { id: "b4", name: "Internet Banda Larga", amount: 120.00, dueDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], paid: true, recurring: true }
];

const DEFAULT_CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: "Alimentação", limit: 800 },
  { category: "Transporte", limit: 400 },
  { category: "Lazer", limit: 500 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "bills" | "budget" | "db_query">("dashboard");
  
  // App states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(3000);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  // Push updates to the backend JSON/SQLite database
  const syncWithDatabase = async (updatedData: {
    transactions?: Transaction[];
    bills?: Bill[];
    monthlyBudget?: number;
    categoryBudgets?: CategoryBudget[];
  }) => {
    try {
      await fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
    } catch (err) {
      console.error("Erro ao sincronizar com o banco de dados:", err);
    }
  };

  // Load from server database on mount, with a robust localStorage replica fallback
  useEffect(() => {
    const loadFromDatabase = async () => {
      try {
        const response = await fetch("/api/db");
        if (!response.ok) throw new Error("Database offline");
        const data = await response.json();
        
        if (data.transactions) setTransactions(data.transactions);
        if (data.bills) setBills(data.bills);
        if (data.monthlyBudget !== undefined) setMonthlyBudget(data.monthlyBudget);
        if (data.categoryBudgets) setCategoryBudgets(data.categoryBudgets);

        // Keep local storage warm as an immediate cache/replica
        localStorage.setItem("fin_transactions", JSON.stringify(data.transactions || []));
        localStorage.setItem("fin_bills", JSON.stringify(data.bills || []));
        localStorage.setItem("fin_monthly_budget", String(data.monthlyBudget ?? 3000));
        localStorage.setItem("fin_category_budgets", JSON.stringify(data.categoryBudgets || []));
      } catch (err) {
        console.warn("Could not connect to database server. Falling back to local offline cache.");
        const storedTransactions = localStorage.getItem("fin_transactions");
        const storedBills = localStorage.getItem("fin_bills");
        const storedBudget = localStorage.getItem("fin_monthly_budget");
        const storedCatBudgets = localStorage.getItem("fin_category_budgets");

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        } else {
          setTransactions(DEFAULT_TRANSACTIONS);
          localStorage.setItem("fin_transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
        }

        if (storedBills) {
          setBills(JSON.parse(storedBills));
        } else {
          setBills(DEFAULT_BILLS);
          localStorage.setItem("fin_bills", JSON.stringify(DEFAULT_BILLS));
        }

        if (storedBudget) {
          setMonthlyBudget(parseFloat(storedBudget));
        } else {
          setMonthlyBudget(3000);
          localStorage.setItem("fin_monthly_budget", "3000");
        }

        if (storedCatBudgets) {
          setCategoryBudgets(JSON.parse(storedCatBudgets));
        } else {
          setCategoryBudgets(DEFAULT_CATEGORY_BUDGETS);
          localStorage.setItem("fin_category_budgets", JSON.stringify(DEFAULT_CATEGORY_BUDGETS));
        }
      }
    };

    loadFromDatabase();
  }, []);

  // Save states to local storage and push synchronously to server
  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem("fin_transactions", JSON.stringify(newTransactions));
    syncWithDatabase({ transactions: newTransactions });
  };

  const saveBills = (newBills: Bill[]) => {
    setBills(newBills);
    localStorage.setItem("fin_bills", JSON.stringify(newBills));
    syncWithDatabase({ bills: newBills });
  };

  const saveMonthlyBudget = (budget: number) => {
    setMonthlyBudget(budget);
    localStorage.setItem("fin_monthly_budget", budget.toString());
    syncWithDatabase({ monthlyBudget: budget });
  };

  const saveCategoryBudgets = (catBudgets: CategoryBudget[]) => {
    setCategoryBudgets(catBudgets);
    localStorage.setItem("fin_category_budgets", JSON.stringify(catBudgets));
    syncWithDatabase({ categoryBudgets: catBudgets });
  };

  // State manipulation handlers
  const handleAddTransaction = (newT: Omit<Transaction, "id">) => {
    const transaction: Transaction = {
      ...newT,
      id: "tx_" + Date.now().toString()
    };
    saveTransactions([transaction, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    saveTransactions(transactions.filter(t => t.id !== id));
  };

  const handleAddBill = (newB: Omit<Bill, "id" | "paid">) => {
    const bill: Bill = {
      ...newB,
      id: "bill_" + Date.now().toString(),
      paid: false
    };
    saveBills([...bills, bill]);
  };

  const handleDeleteBill = (id: string) => {
    saveBills(bills.filter(b => b.id !== id));
  };

  const handleToggleBillPaid = (id: string) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === id) {
        const nextPaidState = !bill.paid;
        
        if (nextPaidState) {
          // Bill was unpaid and now marked as paid -> Auto create transaction
          const inferredCategory = 
            bill.name.toLowerCase().includes("luz") || 
            bill.name.toLowerCase().includes("energia") || 
            bill.name.toLowerCase().includes("água") || 
            bill.name.toLowerCase().includes("aluguel") ||
            bill.name.toLowerCase().includes("condomínio") ||
            bill.name.toLowerCase().includes("internet")
              ? "Moradia" 
              : bill.name.toLowerCase().includes("netflix") || 
                bill.name.toLowerCase().includes("spotify") || 
                bill.name.toLowerCase().includes("disney")
                ? "Lazer"
                : "Outros";

          handleAddTransaction({
            description: `Pagamento: ${bill.name}`,
            amount: bill.amount,
            type: "expense",
            category: inferredCategory,
            date: new Date().toISOString().split('T')[0]
          });
        } else {
          // Bill was paid and now marked as unpaid -> Delete matching payment transaction
          const paymentDesc = `Pagamento: ${bill.name}`;
          saveTransactions(transactions.filter(t => t.description !== paymentDesc));
        }

        return { ...bill, paid: nextPaidState };
      }
      return bill;
    });

    saveBills(updatedBills);
  };

  const handleUpdateCategoryBudget = (category: string, limit: number) => {
    const exists = categoryBudgets.some(cb => cb.category === category);
    let updated: CategoryBudget[];
    if (exists) {
      updated = categoryBudgets.map(cb => cb.category === category ? { ...cb, limit } : cb);
    } else {
      updated = [...categoryBudgets, { category, limit }];
    }
    saveCategoryBudgets(updated);
  };

  const handleRemoveCategoryBudget = (category: string) => {
    saveCategoryBudgets(categoryBudgets.filter(cb => cb.category !== category));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Mesh Gradient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="bg-slate-950/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-emerald-400 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">
                Finança<span className="text-blue-400">Pro</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Persistência Centralizada</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-semibold text-slate-400">Banco de Dados Ativo</span>
              <span className="text-xs font-bold text-emerald-400">ebsonsilva7@gmail.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Sub-toolbar (Hidden on Mobile) */}
      <nav className="hidden sm:block bg-white/5 backdrop-blur-md border-b border-white/10 py-2.5 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-white/15 text-white border border-white/10 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-blue-400" />
            Painel Geral
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "transactions"
                ? "bg-white/15 text-white border border-white/10 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ArrowRightLeft className="h-4 w-4 text-rose-400" />
            Lançamentos & Gastos
          </button>

          <button
            onClick={() => setActiveTab("bills")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "bills"
                ? "bg-white/15 text-white border border-white/10 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CalendarRange className="h-4 w-4 text-amber-400" />
            Contas Fixas / Boletos
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "budget"
                ? "bg-white/15 text-white border border-white/10 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Target className="h-4 w-4 text-emerald-400" />
            Planejamento & Orçamentos
          </button>

          <button
            onClick={() => setActiveTab("db_query")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "db_query"
                ? "bg-white/15 text-white border border-white/10 shadow-xs"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Database className="h-4 w-4 text-purple-400" />
            Consulta Banco de Dados
          </button>
        </div>
      </nav>

      {/* Main Container (Padding added to bottom for mobile app bar clearance) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 sm:pb-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {activeTab === "dashboard" && (
              <Dashboard 
                transactions={transactions} 
                bills={bills} 
                monthlyBudget={monthlyBudget} 
              />
            )}

            {activeTab === "transactions" && (
              <TransactionsManager 
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeTab === "bills" && (
              <BillsManager 
                bills={bills}
                onAddBill={handleAddBill}
                onDeleteBill={handleDeleteBill}
                onToggleBillPaid={handleToggleBillPaid}
              />
            )}

            {activeTab === "budget" && (
              <BudgetPlanner 
                monthlyBudget={monthlyBudget}
                onUpdateMonthlyBudget={saveMonthlyBudget}
                categoryBudgets={categoryBudgets}
                onUpdateCategoryBudget={handleUpdateCategoryBudget}
                onRemoveCategoryBudget={handleRemoveCategoryBudget}
                transactions={transactions}
              />
            )}

            {activeTab === "db_query" && (
              <DatabaseQuery />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Bottom Tab Bar (App-like Interface) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-2.5 sm:hidden px-4 pb-safe shadow-2xl">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "dashboard" ? "text-blue-400 font-bold" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px]">Painel</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "transactions" ? "text-rose-400 font-bold" : "text-slate-400"
          }`}
        >
          <ArrowRightLeft className="h-5 w-5" />
          <span className="text-[9px]">Extrato</span>
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "bills" ? "text-amber-400 font-bold" : "text-slate-400"
          }`}
        >
          <CalendarRange className="h-5 w-5" />
          <span className="text-[9px]">Boletos</span>
        </button>

        <button
          onClick={() => setActiveTab("budget")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "budget" ? "text-emerald-400 font-bold" : "text-slate-400"
          }`}
        >
          <Target className="h-5 w-5" />
          <span className="text-[9px]">Planos</span>
        </button>

        <button
          onClick={() => setActiveTab("db_query")}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === "db_query" ? "text-purple-400 font-bold" : "text-slate-400"
          }`}
        >
          <Database className="h-5 w-5" />
          <span className="text-[9px]">Consulta BD</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 py-6 mt-12 relative z-10 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-semibold">
          <p>© {new Date().getFullYear()} FinançaPro. Todos os direitos reservados. Sincronizado com Banco de Dados Persistente.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-white cursor-pointer transition-colors">Termos de Uso</span>
          </div>
        </div>
      </footer>
    </div>
  );

}
