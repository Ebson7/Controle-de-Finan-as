import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Target, 
  Settings2, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Trash2,
  PieChart
} from "lucide-react";
import { Transaction, CategoryBudget } from "../types";

interface BudgetPlannerProps {
  monthlyBudget: number;
  onUpdateMonthlyBudget: (limit: number) => void;
  categoryBudgets: CategoryBudget[];
  onUpdateCategoryBudget: (category: string, limit: number) => void;
  onRemoveCategoryBudget: (category: string) => void;
  transactions: Transaction[];
}

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros"
];

export default function BudgetPlanner({
  monthlyBudget,
  onUpdateMonthlyBudget,
  categoryBudgets,
  onUpdateCategoryBudget,
  onRemoveCategoryBudget,
  transactions
}: BudgetPlannerProps) {
  const [tempLimit, setTempLimit] = useState(monthlyBudget > 0 ? monthlyBudget.toString() : "");
  
  // Category form state
  const [selectedCategory, setSelectedCategory] = useState("Alimentação");
  const [catLimit, setCatLimit] = useState("");
  const [error, setError] = useState("");

  const handleUpdateGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(tempLimit);
    if (!isNaN(limit) && limit >= 0) {
      onUpdateMonthlyBudget(limit);
    }
  };

  const handleAddCategoryLimit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const limit = parseFloat(catLimit);
    if (isNaN(limit) || limit <= 0) {
      setError("Insira um limite válido maior que zero.");
      return;
    }
    onUpdateCategoryBudget(selectedCategory, limit);
    setCatLimit("");
  };

  // Calculate actual spending by category
  const getCategorySpending = (cat: string) => {
    return transactions
      .filter(t => t.type === "expense" && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Set Limits Column */}
      <div className="lg:col-span-1 space-y-6">
        {/* Global Budget Limit Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Orçamento Global</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Defina o limite máximo que você deseja gastar no mês em todas as categorias somadas.
          </p>

          <form onSubmit={handleUpdateGlobal} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Limite Geral Mensal (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-sm font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              Definir Orçamento Global
            </button>
          </form>
        </div>

        {/* Category Budget Limit Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Limites por Categoria</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Defina limites individuais para categorias específicas de despesas para acompanhar mais de perto.
          </p>

          <form onSubmit={handleAddCategoryLimit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Limite Máximo (R$)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-sm font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={catLimit}
                  onChange={(e) => setCatLimit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20"
            >
              Definir Limite de Categoria
            </button>
          </form>
        </div>
      </div>

      {/* Progress tracking Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Acompanhamento dos Limites</h3>
          </div>

          {/* If no limits set at all */}
          {monthlyBudget === 0 && categoryBudgets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Target className="h-10 w-10 mx-auto mb-3 text-slate-500" />
              <p className="text-sm font-medium">Nenhum planejamento ou limite de gastos definido ainda.</p>
              <p className="text-xs text-slate-500 mt-1">Insira valores no painel esquerdo para planejar o seu mês.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Budget Tracker if active */}
              {monthlyBudget > 0 && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-200">Orçamento Geral</span>
                    <span className="text-xs text-slate-400">
                      R$ {totalExpense.toLocaleString("pt-BR")} de R$ {monthlyBudget.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalExpense > monthlyBudget ? "bg-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                      }`}
                      style={{ width: `${Math.min((totalExpense / monthlyBudget) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {((totalExpense / monthlyBudget) * 100).toFixed(0)}% utilizado
                    </span>
                    {totalExpense > monthlyBudget ? (
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Orçamento Estourado!
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        R$ {(monthlyBudget - totalExpense).toLocaleString("pt-BR")} restantes
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Category Budgets Tracker if active */}
              {categoryBudgets.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acompanhamento por Categoria</h4>
                  
                  {categoryBudgets.map((catBudget) => {
                    const spent = getCategorySpending(catBudget.category);
                    const usagePercent = (spent / catBudget.limit) * 100;
                    const isExceeded = spent > catBudget.limit;

                    return (
                      <div key={catBudget.category} className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-200">{catBudget.category}</span>
                            {isExceeded && (
                              <span className="text-[9px] font-extrabold bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-sm border border-rose-500/20 flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" /> ESTOURADO
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveCategoryBudget(catBudget.category)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-md transition-colors"
                            title="Remover limite"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>Gasto: R$ {spent.toLocaleString("pt-BR")}</span>
                          <span>Limite: R$ {catBudget.limit.toLocaleString("pt-BR")}</span>
                        </div>

                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExceeded ? "bg-rose-500" : usagePercent > 80 ? "bg-amber-500" : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
                          <span>{usagePercent.toFixed(0)}% utilizado</span>
                          {!isExceeded ? (
                            <span className="text-emerald-400 font-semibold">
                              R$ {(catBudget.limit - spent).toLocaleString("pt-BR")} disponíveis
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold">
                              Passou R$ {(spent - catBudget.limit).toLocaleString("pt-BR")} do limite
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
