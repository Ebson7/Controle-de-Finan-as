import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  HelpCircle,
  TrendingDown,
  RefreshCw,
  Award
} from "lucide-react";
import { Transaction, Bill, ChatMessage, AIInsights } from "../types";

interface AIAssistantProps {
  transactions: Transaction[];
  bills: Bill[];
  monthlyBudget: number;
}

const QUICK_QUESTIONS = [
  "Como posso economizar R$ 300 este mês?",
  "Analise meu padrão de gastos atual.",
  "Dá para reduzir o valor das minhas contas fixas?",
  "Quantos por cento do meu orçamento já gastei?"
];

export default function AIAssistant({ transactions, bills, monthlyBudget }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "chat">("insights");
  
  // Insights States
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Total Income for analysis context
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Fetch initial or refreshed insights
  const generateInsights = async () => {
    setLoadingInsights(true);
    setInsightsError("");
    try {
      const response = await fetch("/api/ai-advisor/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions,
          bills,
          monthlyBudget,
          totalIncome
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao conectar com o serviço de IA.");
        }
        throw new Error(`Erro do servidor (Status ${response.status}).`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (err: any) {
      console.error(err);
      setInsightsError(err.message || "Erro ao gerar insights personalizados.");
    } finally {
      setLoadingInsights(false);
    }
  };

  // Trigger initial insights generation on mount if not already loaded and transactions exist
  useEffect(() => {
    if (!insights && transactions.length > 0 && !loadingInsights) {
      generateInsights();
    }
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingChat]);

  // Send a message to AI Assistant
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loadingChat) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMsg("");
    setLoadingChat(true);

    try {
      // Build history payload (last 10 messages)
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/ai-advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          transactions,
          bills,
          monthlyBudget,
          totalIncome
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao responder sua dúvida.");
        }
        throw new Error(`Erro do servidor (Status ${response.status}).`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: data.text || "Desculpe, não consegui formular uma resposta no momento.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: `⚠️ Desculpe, ocorreu um erro ao entrar em contato com o assistente: ${err.message}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Finan - IA Conselheira</h2>
            <p className="text-xs text-indigo-100 mt-0.5">Sua inteligência financeira personalizada baseada em seus gastos reais</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex p-1 bg-white/10 rounded-xl backdrop-blur-md self-start md:self-auto">
          <button
            onClick={() => setActiveTab("insights")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "insights" ? "bg-white text-indigo-600 shadow-xs" : "text-white hover:bg-white/5"
            }`}
          >
            Insights IA
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "chat" ? "bg-white text-indigo-600 shadow-xs" : "text-white hover:bg-white/5"
            }`}
          >
            Conversar com Assistente
          </button>
        </div>
      </div>

      {/* Main tab display area */}
      <div className="grid gap-6">
        {activeTab === "insights" ? (
          /* Insights Tab */
          <div className="space-y-6">
            {/* Generate banner trigger if not loaded */}
            {!insights && !loadingInsights && (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/20 p-8 text-center max-w-2xl mx-auto">
                <Sparkles className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800">Gerar Relatório Inteligente</h3>
                <p className="text-sm text-slate-500 mt-2 mb-6">
                  Nosso assistente analisará suas transações de entradas e saídas, as contas fixas cadastradas e seu planejamento de limites para lhe entregar conselhos acionáveis e uma nota de saúde financeira.
                </p>
                <button
                  onClick={generateInsights}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Analisar minhas Finanças
                </button>
              </div>
            )}

            {/* Loading State */}
            {loadingInsights && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-700">A IA está analisando seus hábitos...</p>
                <p className="text-xs text-slate-400 mt-1">Calculando notas de saúde, interpretando categorias e formulando dicas de economia.</p>
              </div>
            )}

            {/* Error State */}
            {insightsError && (
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 text-xs text-rose-600 flex items-start gap-2.5 max-w-xl mx-auto">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Ocorreu um problema ao gerar os insights</p>
                  <p className="mt-1">{insightsError}</p>
                  <button 
                    onClick={generateInsights} 
                    className="mt-3 font-semibold text-rose-700 underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Tentar novamente
                  </button>
                </div>
              </div>
            )}

            {/* Loaded State */}
            {insights && !loadingInsights && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Score and Summary Column */}
                <div className="md:col-span-1 space-y-6">
                  {/* Score Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col items-center text-center"
                  >
                    <h3 className="text-sm font-bold text-slate-500 mb-4">Nota de Saúde Financeira</h3>
                    
                    {/* Circle Score Gauge */}
                    <div className="relative flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          stroke="#f1f5f9"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="52"
                          stroke={
                            insights.financialHealthScore >= 80 
                              ? "#10b981" 
                              : insights.financialHealthScore >= 50 
                                ? "#f59e0b" 
                                : "#ef4444"
                          }
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 52}
                          initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - insights.financialHealthScore / 100) }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-slate-800">{insights.financialHealthScore}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">do score</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 border border-slate-100">
                        <Award className={`h-3.5 w-3.5 ${
                          insights.financialHealthScore >= 80 ? 'text-emerald-500' : insights.financialHealthScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                        }`} />
                        <span className="text-slate-600">
                          {insights.financialHealthScore >= 80 
                            ? "Muito Saudável" 
                            : insights.financialHealthScore >= 50 
                              ? "Atenção Moderada" 
                              : "Risco de Limite"
                          }
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Summary Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs"
                  >
                    <h3 className="text-sm font-bold text-slate-700 mb-2">Diagnóstico de Comportamento</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{insights.summary}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">Análise atualizada</span>
                      <button 
                        onClick={generateInsights} 
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Atualizar
                      </button>
                    </div>
                  </motion.div>
                </div>

                {/* Tips and Category comments columns */}
                <div className="md:col-span-2 space-y-6">
                  {/* Tips list */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-500" />
                      Dicas Inteligentes de Economia
                    </h3>
                    
                    <div className="space-y-3">
                      {insights.tips.map((tip, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/50 flex gap-3">
                          <div className={`p-2 rounded-lg shrink-0 self-start ${
                            tip.category === "Economia" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : tip.category === "Alerta" 
                                ? "bg-rose-50 text-rose-600" 
                                : tip.category === "Planejamento" 
                                  ? "bg-indigo-50 text-indigo-600" 
                                  : "bg-amber-50 text-amber-600"
                          }`}>
                            {tip.category === "Economia" ? (
                              <TrendingDown className="h-4 w-4" />
                            ) : tip.category === "Alerta" ? (
                              <AlertTriangle className="h-4 w-4" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-800">{tip.title}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                tip.category === "Economia" 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : tip.category === "Alerta" 
                                    ? "bg-rose-100 text-rose-700" 
                                    : tip.category === "Planejamento" 
                                      ? "bg-indigo-100 text-indigo-700" 
                                      : "bg-amber-100 text-amber-700"
                              }`}>
                                {tip.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-normal">{tip.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category feedback comments */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-purple-500" />
                      Feedback dos Gastos por Categoria
                    </h3>

                    {insights.categoryAnalysis.length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhuma despesa para realizar feedback.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {insights.categoryAnalysis.map((cat, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                cat.status === "good" 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : cat.status === "warning" 
                                    ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                    : "bg-rose-50 text-rose-600 border border-rose-100"
                              }`}>
                                {cat.status === "good" ? "BOM" : cat.status === "warning" ? "ALERTA" : "CRÍTICO"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 leading-snug">{cat.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Chat Tab */
          <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden flex flex-col h-[520px]">
            {/* Conversations log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <Bot className="h-12 w-12 text-indigo-400 mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">Dúvidas sobre seu Orçamento?</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                    Eu conheço sua situação de gastos, limite geral e contas para o mês! Pergunte qualquer coisa ou use as sugestões abaixo para começar.
                  </p>

                  <div className="grid gap-2 max-w-md w-full">
                    {QUICK_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="p-3 text-left text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 self-start ${
                        m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-indigo-600" />}
                      </div>

                      <div className="space-y-1">
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          m.role === "user" 
                            ? "bg-indigo-500 text-white rounded-tr-none" 
                            : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-wrap"
                        }`}>
                          {m.text}
                        </div>
                        <p className={`text-[9px] text-slate-400 font-medium ${m.role === "user" ? "text-right" : "text-left"}`}>
                          {m.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {loadingChat && (
                    <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                      <div className="p-2.5 rounded-xl bg-slate-100">
                        <Bot className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 text-xs flex items-center gap-1.5 rounded-tl-none">
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                        <span>Finan está digitando conselhos...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input form */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Pergunte ex: 'Estou gastando muito com lazer?', 'Como guardar dinheiro?'..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputMsg)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                disabled={loadingChat}
              />
              <button
                onClick={() => handleSendMessage(inputMsg)}
                disabled={loadingChat || !inputMsg.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
