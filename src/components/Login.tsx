import React, { useState } from "react";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Database,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("ebsonsilva7@gmail.com"); // Pre-fill with the developer's email
  const [password, setPassword] = useState("123456"); // Pre-fill with default test password
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Algo deu errado durante a autenticação.");
      }

      if (data.success) {
        if (!isLogin) {
          setSuccessMsg("Conta criada com sucesso! Redirecionando para o painel...");
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1500);
        } else {
          onLoginSuccess(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseCredentials = () => {
    setEmail("ebsonsilva7@gmail.com");
    setPassword("123456");
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative cosmic background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-500/15 p-3 rounded-2xl text-blue-400 mb-3 border border-blue-500/20">
            <Database className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Finance <span className="text-blue-400">BRU</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistema de Gestão Sincronizado em Banco de Dados
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-white/5 border border-white/5 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              isLogin 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              !isLogin 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-500/15 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2 mb-4"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 mb-4"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Nome do usuário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Endereço de Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Entrar no Painel" : "Cadastrar Usuário"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper (Highly user friendly) */}
        {isLogin && (
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 mb-2">Deseja testar com a conta pré-configurada?</p>
            <button
              onClick={handleUseCredentials}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
            >
              <Database className="h-3 w-3" />
              Autocompletar Admin de Teste
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
