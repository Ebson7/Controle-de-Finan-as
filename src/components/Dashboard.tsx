import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  PieChart as PieIcon,
  BarChart3,
  FileDown
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { Transaction, Bill } from "../types";
import { exportMonthlyReportToPDF } from "../utils/pdfExport";

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
  monthlyBudget: number;
  userEmail?: string;
}

export default function Dashboard({ transactions, bills, monthlyBudget, userEmail }: DashboardProps) {
  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Unpaid bills summary
  const unpaidBills = bills.filter(b => !b.paid);
  const totalUnpaidBillsAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  // Group transactions by category for Pie Chart
  const categoryDataMap: Record<string, number> = {};
  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      categoryDataMap[t.category] = (categoryDataMap[t.category] || 0) + t.amount;
    });

  const pieData = Object.entries(categoryDataMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Chart colors
  const COLORS = [
    "#60a5fa", // Blue
    "#f87171", // Red/Rose
    "#34d399", // Emerald
    "#fbbf24", // Amber
    "#a78bfa", // Purple
    "#f472b6", // Pink
    "#22d3ee", // Cyan
  ];

  // Budget status
  const budgetUsagePercent = monthlyBudget > 0 ? (totalExpense / monthlyBudget) * 100 : 0;
  const isBudgetExceeded = totalExpense > monthlyBudget;

  // Monthly flow data for simple bar chart (Income vs Expense)
  const flowData = [
    {
      name: "Fluxo",
      Receitas: totalIncome,
      Despesas: totalExpense,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title with PDF Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Painel Geral</h2>
          <p className="text-sm text-slate-400">Resumo visual de suas finanças e despesas recentes</p>
        </div>
        <button
          onClick={() => exportMonthlyReportToPDF(transactions, bills, monthlyBudget, userEmail)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 cursor-pointer self-stretch sm:self-auto"
        >
          <FileDown className="h-4 w-4 text-blue-200" />
          Exportar Mês para PDF
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Saldo Atual</span>
            <div className={`rounded-2xl p-2.5 ${balance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-extrabold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Soma total de receitas menos despesas</p>
          </div>
        </motion.div>

        {/* Income Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Receitas</span>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">
              R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1">Entradas cadastradas no mês</p>
          </div>
        </motion.div>

        {/* Expense Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Despesas</span>
            <div className="rounded-2xl bg-rose-500/10 p-2.5 text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-rose-400">
              R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-rose-400 mt-1">Saídas cadastradas no mês</p>
          </div>
        </motion.div>

        {/* Unpaid Bills Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Contas a Pagar</span>
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-amber-400">
              R$ {totalUnpaidBillsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {unpaidBills.length} {unpaidBills.length === 1 ? 'conta pendente' : 'contas pendentes'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Orçamento mensal progress bar */}
      {monthlyBudget > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Progresso do Orçamento Mensal</h4>
              <p className="text-xs text-slate-400">Limite definido: R$ {monthlyBudget.toLocaleString("pt-BR")}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${isBudgetExceeded ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`}>
                {budgetUsagePercent.toFixed(1)}% utilizado
              </span>
              <p className="text-xs text-slate-400">
                R$ {totalExpense.toLocaleString("pt-BR")} de R$ {monthlyBudget.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
            />
          </div>
          {isBudgetExceeded && (
            <div className="flex items-center gap-2 mt-3 text-rose-400 text-xs font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Atenção! Você ultrapassou seu orçamento planejado em R$ {(totalExpense - monthlyBudget).toLocaleString("pt-BR")}</span>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart: Expenses by Category */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="h-4 w-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Gastos por Categoria</h4>
          </div>
          <div className="h-64 flex-1 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">Nenhuma despesa cadastrada no momento.</p>
                <p className="text-xs text-slate-500 mt-1">Insira gastos na aba "Transações" para visualizar.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`}
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#fff" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Income vs Expense flow */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Fluxo Mensal (Entradas vs Saídas)</h4>
          </div>
          <div className="h-64 flex-1">
            {totalIncome === 0 && totalExpense === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-slate-400">Dados insuficientes para desenhar o fluxo.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any) => `R$ ${value.toLocaleString("pt-BR")}`}
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#fff" }}
                  />
                  <Legend iconType="circle" formatter={(value) => <span className="text-xs text-slate-400">{value}</span>} />
                  <Bar dataKey="Receitas" fill="#34d399" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#f87171" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Próximas Contas a Vencer */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
        <h4 className="text-sm font-bold text-white mb-4">Suas Contas Fixas Pendentes</h4>
        {unpaidBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">Tudo pago! Nenhuma conta fixa pendente.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unpaidBills.slice(0, 3).map((bill) => {
              const diffDays = Math.ceil(
                (new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
              );
              const isOverdue = diffDays < 0;

              return (
                <div key={bill.id} className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col justify-between hover:bg-white/10 transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm truncate max-w-[150px]">{bill.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOverdue 
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                          : diffDays <= 3 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isOverdue ? 'Atrasado' : `Vence em ${diffDays}d`}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-bold text-white">
                      R$ {bill.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-400">
                    Vencimento: {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
