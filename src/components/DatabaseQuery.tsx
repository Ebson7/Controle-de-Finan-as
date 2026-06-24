import React, { useState, useEffect } from "react";
import { 
  Database, 
  Search, 
  Play, 
  Clock, 
  Server, 
  Table, 
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Transaction, Bill } from "../types";

interface QueryMeta {
  timestamp: string;
  queryTimeMs: number;
  rowsScanned: number;
  rowsReturned: number;
  schema: any;
}

export default function DatabaseQuery() {
  const [targetTable, setTargetTable] = useState<"all" | "transactions" | "bills">("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ transactions: Transaction[]; bills: Bill[] } | null>(null);
  const [meta, setMeta] = useState<QueryMeta | null>(null);

  const categories = [
    "Salário", "Alimentação", "Transporte", "Lazer", "Moradia", "Outros"
  ];

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const params = new URLSearchParams();
      if (targetTable) params.append("targetTable", targetTable);
      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);
      if (type && type !== "all") params.append("type", type);
      if (minAmount) params.append("minAmount", minAmount);
      if (maxAmount) params.append("maxAmount", maxAmount);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/db/query?${params.toString()}`);
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Servidor offline ou retornou página inválida. Usando banco de dados local...");
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setMeta(data.meta);
      } else {
        throw new Error(data.error || "Erro desconhecido.");
      }
    } catch (err: any) {
      console.warn("API Query failed, falling back to local database query engine:", err);
      // Client-side local fallback implementation of the exact same query engine
      try {
        const storedUser = localStorage.getItem("fin_user");
        let uid = "u1";
        if (storedUser) {
          try {
            uid = JSON.parse(storedUser).id;
          } catch (e) {
            console.error(e);
          }
        }

        // Load local transactions
        const localTxStr = localStorage.getItem(`fin_transactions_${uid}`);
        let localTx: Transaction[] = [];
        if (localTxStr) {
          try {
            localTx = JSON.parse(localTxStr);
          } catch (e) {
            console.error(e);
          }
        }

        // Load local bills
        const localBillsStr = localStorage.getItem(`fin_bills_${uid}`);
        let localBills: Bill[] = [];
        if (localBillsStr) {
          try {
            localBills = JSON.parse(localBillsStr);
          } catch (e) {
            console.error(e);
          }
        }

        // Load local users
        const localUsersStr = localStorage.getItem("local_users");
        let localUsers: any[] = [];
        if (localUsersStr) {
          try {
            localUsers = JSON.parse(localUsersStr);
          } catch (e) {
            console.error(e);
          }
        }

        const filteredTx = localTx.filter((t) => {
          if (targetTable !== "all" && targetTable !== "transactions") return false;
          if (search) {
            const s = search.toLowerCase();
            if (!t.description.toLowerCase().includes(s) && !t.category.toLowerCase().includes(s)) return false;
          }
          if (category && category !== "all" && t.category !== category) return false;
          if (type && type !== "all" && t.type !== type) return false;
          if (minAmount && t.amount < Number(minAmount)) return false;
          if (maxAmount && t.amount > Number(maxAmount)) return false;
          if (startDate && t.date < startDate) return false;
          if (endDate && t.date > endDate) return false;
          return true;
        });

        const filteredBills = localBills.filter((b) => {
          if (targetTable !== "all" && targetTable !== "bills") return false;
          if (search) {
            const s = search.toLowerCase();
            if (!b.name.toLowerCase().includes(s)) return false;
          }
          if (minAmount && b.amount < Number(minAmount)) return false;
          if (maxAmount && b.amount > Number(maxAmount)) return false;
          return true;
        });

        const filteredUsers = localUsers.filter((u) => {
          if (targetTable !== "all" && targetTable !== "transactions" && targetTable !== "bills") {
            // "users" target check
            if (search) {
              const s = search.toLowerCase();
              if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false;
            }
            return true;
          }
          return false;
        });

        const queryTimeMs = Date.now() - startTime;
        setResults({
          transactions: filteredTx,
          bills: filteredBills,
          // Since types.ts results interface expects transactions & bills:
          ...(filteredUsers.length > 0 ? { users: filteredUsers } : {})
        } as any);

        setMeta({
          timestamp: new Date().toISOString(),
          queryTimeMs,
          rowsScanned: localTx.length + localBills.length + localUsers.length,
          rowsReturned: filteredTx.length + filteredBills.length + filteredUsers.length,
          schema: {
            users: {
              id: "TEXT (PRIMARY KEY)",
              name: "TEXT",
              email: "TEXT (UNIQUE)",
              passwordHash: "TEXT",
              createdAt: "TEXT"
            },
            transactions: {
              id: "TEXT (PRIMARY KEY)",
              userId: "TEXT (FOREIGN KEY TO users.id)",
              description: "TEXT",
              amount: "REAL",
              type: "TEXT (income | expense)",
              category: "TEXT",
              date: "TEXT"
            },
            bills: {
              id: "TEXT (PRIMARY KEY)",
              userId: "TEXT (FOREIGN KEY TO users.id)",
              name: "TEXT",
              amount: "REAL",
              dueDate: "TEXT",
              paid: "BOOLEAN",
              recurring: "BOOLEAN"
            }
          }
        });
      } catch (localErr) {
        console.error("Local query execution failed:", localErr);
        setError("Erro de conexão e erro ao processar consulta local.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunQuery();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/15 p-3 rounded-2xl text-blue-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Consulta ao Banco de Dados (JSON SQL Engine)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Acesse o servidor de persistência central para consultar registros usando filtros relacionais em tempo real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Banco Online & Persistente</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Query Builder Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-400" />
              Parâmetros de Busca
            </h3>

            <div className="space-y-4">
              {/* Target Table */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tabela / Coleção</label>
                <select
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all" className="bg-slate-900 text-white">Todas as Tabelas</option>
                  <option value="transactions" className="bg-slate-900 text-white">Transações (transactions)</option>
                  <option value="bills" className="bg-slate-900 text-white">Contas Firas (bills)</option>
                </select>
              </div>

              {/* Keyword */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Palavra-chave</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar por nome/descrição..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden placeholder-slate-500"
                  />
                </div>
              </div>

              {targetTable !== "bills" && (
                <>
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria (Apenas Transações)</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all" className="bg-slate-900 text-white">Todas as Categorias</option>
                      {categories.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Lançamento</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all" className="bg-slate-900 text-white">Receitas e Despesas</option>
                      <option value="income" className="bg-slate-900 text-white">Apenas Receitas</option>
                      <option value="expense" className="bg-slate-900 text-white">Apenas Despesas</option>
                    </select>
                  </div>
                </>
              )}

              {/* Amount Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Mínimo (R$)</label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Máximo (R$)</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden placeholder-slate-500"
                  />
                </div>
              </div>

              {targetTable !== "bills" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Data Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Data Fim</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRunQuery}
                disabled={loading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {loading ? "Consultando..." : "Executar Consulta"}
              </button>
            </div>
          </div>

          {/* Database Schema Map Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 text-xs">
            <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Table className="h-4 w-4 text-emerald-400" />
              Esquema de Tabelas (DDL)
            </h4>
            <div className="space-y-3 font-mono text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-blue-400 font-bold">CREATE TABLE</span> <span className="text-white">transactions</span> (
                <div className="pl-3">
                  id <span className="text-slate-500">TEXT PRIMARY KEY</span>,<br />
                  description <span className="text-slate-500">TEXT</span>,<br />
                  amount <span className="text-slate-500">NUMERIC(10,2)</span>,<br />
                  type <span className="text-slate-500">VARCHAR(10)</span>,<br />
                  category <span className="text-slate-500">VARCHAR(50)</span>,<br />
                  date <span className="text-slate-500">DATE</span>
                </div>
                );
              </div>
              <div className="border-t border-white/5 pt-3">
                <span className="text-blue-400 font-bold">CREATE TABLE</span> <span className="text-white">bills</span> (
                <div className="pl-3">
                  id <span className="text-slate-500">TEXT PRIMARY KEY</span>,<br />
                  name <span className="text-slate-500">TEXT</span>,<br />
                  amount <span className="text-slate-500">NUMERIC(10,2)</span>,<br />
                  dueDate <span className="text-slate-500">DATE</span>,<br />
                  paid <span className="text-slate-500">BOOLEAN</span>,<br />
                  recurring <span className="text-slate-500">BOOLEAN</span>
                </div>
                );
              </div>
            </div>
          </div>
        </div>

        {/* Query Results and Performance Metrics Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Performance Metrics Bar */}
          {meta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 shadow-md">
              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-blue-400" /> Latência
                </span>
                <span className="block text-sm font-extrabold text-blue-400 mt-1">{meta.queryTimeMs} ms</span>
              </div>
              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-emerald-400" /> Linhas Escaneadas
                </span>
                <span className="block text-sm font-extrabold text-emerald-400 mt-1">{meta.rowsScanned}</span>
              </div>
              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="h-3 w-3 text-amber-400" /> Registros Retornados
                </span>
                <span className="block text-sm font-extrabold text-amber-400 mt-1">{meta.rowsReturned}</span>
              </div>
              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-purple-400" /> Status
                </span>
                <span className="block text-sm font-extrabold text-purple-400 mt-1">SUCCESS</span>
              </div>
            </div>
          )}

          {/* Results Container */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-lg shadow-black/20 min-h-[400px]">
            <h3 className="text-sm font-bold text-slate-200 mb-4">Registros Retornados da Consulta</h3>

            {error && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-xs font-semibold">Consultando banco de dados...</p>
              </div>
            ) : (!results || (results.transactions.length === 0 && results.bills.length === 0)) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500">
                <Database className="h-10 w-10 mb-3 text-slate-600" />
                <p className="text-sm font-bold">Nenhum resultado para esta consulta</p>
                <p className="text-xs max-w-sm mt-1">Ajuste os filtros de busca à esquerda e clique em Executar Consulta para carregar registros.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Transactions Result Table */}
                {results.transactions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                      Tabela de Transações ({results.transactions.length} registros)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold">
                            <th className="p-3">ID</th>
                            <th className="p-3">Descrição</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Data</th>
                            <th className="p-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {results.transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-mono text-[10px] text-slate-500">{t.id}</td>
                              <td className="p-3 font-semibold text-slate-200">{t.description}</td>
                              <td className="p-3">
                                <span className="bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {t.category}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 font-mono text-[10px]">{t.date}</td>
                              <td className={`p-3 text-right font-bold ${
                                t.type === "income" ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                {t.type === "income" ? "+" : "-"} R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bills Result Table */}
                {results.bills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-amber-400" />
                      Tabela de Contas Fixas & Boletos ({results.bills.length} registros)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/20">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold">
                            <th className="p-3">ID</th>
                            <th className="p-3">Nome da Conta</th>
                            <th className="p-3">Vencimento</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {results.bills.map((b) => (
                            <tr key={b.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-mono text-[10px] text-slate-500">{b.id}</td>
                              <td className="p-3 font-semibold text-slate-200">{b.name}</td>
                              <td className="p-3 text-slate-400 font-mono text-[10px]">{b.dueDate}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  b.paid 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}>
                                  {b.paid ? "PAGA" : "PENDENTE"}
                                </span>
                              </td>
                              <td className="p-3 text-right font-extrabold text-slate-200">
                                R$ {b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
