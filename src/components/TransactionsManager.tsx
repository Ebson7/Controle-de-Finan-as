import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  Tag,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Transaction } from "../types";

interface TransactionsManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, "id">) => void;
  onDeleteTransaction: (id: string) => void;
}

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Salário",
  "Investimentos",
  "Outros"
];

export default function TransactionsManager({ 
  transactions, 
  onAddTransaction, 
  onDeleteTransaction 
}: TransactionsManagerProps) {
  // Add Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Alimentação");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Por favor, insira uma descrição.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Por favor, insira um valor válido maior que zero.");
      return;
    }
    if (!category) {
      setError("Selecione uma categoria.");
      return;
    }
    if (!date) {
      setError("Selecione uma data válida.");
      return;
    }

    onAddTransaction({
      description: description.trim(),
      amount: numericAmount,
      type,
      category,
      date
    });

    // Reset Form
    setDescription("");
    setAmount("");
    // Keep category and type as is for consecutive entries
  };

  // Filter & Sort Logic
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" ? true : t.type === filterType;
      const matchesCategory = filterCategory === "all" ? true : t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Transaction Entry Form */}
      <div className="lg:col-span-1">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 sticky top-6">
          <h3 className="text-lg font-bold text-white mb-4">Adicionar Transação</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  if (category === "Salário") setCategory("Alimentação");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === "expense"
                    ? "bg-white/15 text-rose-400 shadow-xs border border-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategory("Salário");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === "income"
                    ? "bg-white/15 text-emerald-400 shadow-xs border border-white/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Receita
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Supermercado, Aluguel, Uber..."
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                type === "expense" 
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10" 
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10"
              }`}
            >
              <Plus className="h-4 w-4" />
              Salvar {type === "expense" ? "Despesa" : "Receita"}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction List and Filters */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filter bar */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-lg shadow-black/20 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden placeholder-slate-500"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <Filter className="h-3 w-3 text-slate-400 ml-1.5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-transparent border-0 text-xs text-slate-200 font-semibold focus:outline-hidden py-1 px-1"
                >
                  <option value="all" className="bg-slate-900 text-white">Tipos (Todos)</option>
                  <option value="income" className="bg-slate-900 text-white">Apenas Receitas</option>
                  <option value="expense" className="bg-slate-900 text-white">Apenas Despesas</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <Tag className="h-3 w-3 text-slate-400 ml-1.5" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent border-0 text-xs text-slate-200 font-semibold focus:outline-hidden py-1 px-1"
                >
                  <option value="all" className="bg-slate-900 text-white">Categorias (Todas)</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <ArrowUpDown className="h-3 w-3 text-slate-400 ml-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-0 text-xs text-slate-200 font-semibold focus:outline-hidden py-1 px-1"
                >
                  <option value="date-desc" className="bg-slate-900 text-white">Mais Recentes</option>
                  <option value="date-asc" className="bg-slate-900 text-white">Mais Antigas</option>
                  <option value="amount-desc" className="bg-slate-900 text-white">Maior Valor</option>
                  <option value="amount-asc" className="bg-slate-900 text-white">Menor Valor</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg shadow-black/20">
          <h4 className="text-sm font-bold text-slate-200 mb-4 px-2">Histórico de Transações ({filteredTransactions.length})</h4>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-500" />
              <p className="text-sm font-medium">Nenhuma transação encontrada.</p>
              <p className="text-xs text-slate-500 mt-1">Experimente alterar os filtros ou cadastrar uma nova transação.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3.5 hover:bg-white/10 rounded-2xl border border-white/5 bg-white/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${
                      t.type === "income" 
                        ? "bg-emerald-500/15 text-emerald-400" 
                        : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {t.type === "income" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 text-sm truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">
                          {t.category}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-sm ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                      title="Excluir transação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
