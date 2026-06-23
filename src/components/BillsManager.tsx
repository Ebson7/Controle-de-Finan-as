import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlertTriangle,
  Info,
  DollarSign
} from "lucide-react";
import { Bill } from "../types";

interface BillsManagerProps {
  bills: Bill[];
  onAddBill: (bill: Omit<Bill, "id" | "paid">) => void;
  onDeleteBill: (id: string) => void;
  onToggleBillPaid: (id: string) => void;
}

export default function BillsManager({ 
  bills, 
  onAddBill, 
  onDeleteBill, 
  onToggleBillPaid 
}: BillsManagerProps) {
  // Add Bill Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurring, setRecurring] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Insira o nome da conta.");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Insira um valor válido.");
      return;
    }
    if (!dueDate) {
      setError("Selecione a data de vencimento.");
      return;

    }

    onAddBill({
      name: name.trim(),
      amount: numericAmount,
      dueDate,
      recurring
    });

    setName("");
    setAmount("");
  };

  // Calculations
  const totalBillsAmount = bills.reduce((sum, b) => sum + b.amount, 0);
  const paidBillsAmount = bills.filter(b => b.paid).reduce((sum, b) => sum + b.amount, 0);
  const unpaidBillsAmount = bills.filter(b => !b.paid).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Add Bill Form */}
      <div className="lg:col-span-1">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 sticky top-6">
          <h3 className="text-lg font-bold text-white mb-4">Cadastrar Nova Conta</h3>
          <p className="text-xs text-slate-400 mb-4">
            Contas fixas mensais (ex: Água, Luz, Internet, Netflix, Aluguel) que vencem todo mês.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bill Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Conta / Boleto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Conta de Luz, Aluguel, Assinatura Spotify"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Valor do Compromisso (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Próximo Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Recurring Option */}
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
              <input
                type="checkbox"
                id="recurring"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 text-blue-500 border-white/10 rounded-sm focus:ring-blue-500"
              />
              <div>
                <label htmlFor="recurring" className="block text-xs font-bold text-slate-200 cursor-pointer">
                  Conta Fixa Mensal
                </label>
                <p className="text-[10px] text-slate-400">Se selecionado, o boleto retorna no mês seguinte quando marcado como pago.</p>
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              Cadastrar Conta
            </button>
          </form>
        </div>
      </div>

      {/* Bill List and Indicators */}
      <div className="lg:col-span-2 space-y-4">
        {/* Quick summary strip */}
        <div className="grid grid-cols-3 gap-2.5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg shadow-black/20">
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contas</span>
            <span className="block text-sm font-extrabold text-blue-400 mt-1">R$ {totalBillsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagas</span>
            <span className="block text-sm font-extrabold text-emerald-400 mt-1">R$ {paidBillsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendente</span>
            <span className="block text-sm font-extrabold text-amber-400 mt-1">R$ {unpaidBillsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex gap-2.5 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-200">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong>Dica inteligente:</strong> Quando você marca uma conta como **Paga**, o sistema cria automaticamente um lançamento de despesa correspondente nas suas transações do dia para atualizar seu saldo geral!
          </p>
        </div>

        {/* Bill cards container */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-lg shadow-black/20">
          <h4 className="text-sm font-bold text-slate-200 mb-4">Contas & Boletos Cadastrados ({bills.length})</h4>

          {bills.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-500" />
              <p className="text-sm font-medium">Nenhum compromisso financeiro cadastrado.</p>
              <p className="text-xs text-slate-400 mt-1">Use o formulário ao lado para programar suas contas fixas do mês.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const billDate = new Date(bill.dueDate);
                billDate.setHours(0,0,0,0);
                
                const diffDays = Math.ceil((billDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                const isOverdue = diffDays < 0 && !bill.paid;

                return (
                  <motion.div
                    key={bill.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      bill.paid 
                        ? 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/15' 
                        : isOverdue 
                          ? 'border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15' 
                          : diffDays <= 3 
                            ? 'border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15' 
                            : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Checkbox button */}
                      <button
                        onClick={() => onToggleBillPaid(bill.id)}
                        className={`mt-0.5 shrink-0 transition-colors ${
                          bill.paid ? "text-emerald-400 hover:text-emerald-300" : "text-slate-400 hover:text-blue-400"
                        }`}
                        title={bill.paid ? "Marcar como pendente" : "Marcar como pago"}
                      >
                        {bill.paid ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${bill.paid ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {bill.name}
                          </span>
                          {bill.recurring && (
                            <span className="text-[9px] font-bold bg-white/10 text-slate-300 px-1.5 py-0.5 rounded-sm">
                              Mensal
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Vencimento: {new Date(bill.dueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                          {!bill.paid && (
                            <span className={`font-bold text-[10px] ${
                              isOverdue ? 'text-rose-400' : diffDays === 0 ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                              {isOverdue ? 'ATRASADO' : diffDays === 0 ? 'VENCE HOJE' : `Vence em ${diffDays}d`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`font-bold text-sm ${bill.paid ? 'text-slate-500' : 'text-white'}`}>
                        R$ {bill.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => onDeleteBill(bill.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                        title="Remover conta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
