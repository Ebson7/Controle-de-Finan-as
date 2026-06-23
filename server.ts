import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Database Configuration & Initialization
const DB_FILE = path.join(process.cwd(), "database.json");

const DEFAULT_DB = {
  transactions: [
    { id: "t1", description: "Salário Mensal", amount: 5500.00, type: "income", category: "Salário", date: new Date().toISOString().split('T')[0] },
    { id: "t2", description: "Supermercado Carrefour", amount: 480.50, type: "expense", category: "Alimentação", date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
    { id: "t3", description: "Posto Shell Combustível", amount: 180.00, type: "expense", category: "Transporte", date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { id: "t4", description: "Jantar Pizzaria", amount: 120.00, type: "expense", category: "Lazer", date: new Date().toISOString().split('T')[0] },
    { id: "t5", description: "Internet Banda Larga", amount: 120.00, type: "expense", category: "Moradia", date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] }
  ],
  bills: [
    { id: "b1", name: "Aluguel", amount: 1500.00, dueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], paid: false, recurring: true },
    { id: "b2", name: "Conta de Energia Coelba", amount: 220.50, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], paid: false, recurring: true },
    { id: "b3", name: "Assinatura Netflix", amount: 55.90, dueDate: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0], paid: false, recurring: true },
    { id: "b4", name: "Internet Banda Larga", amount: 120.00, dueDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], paid: true, recurring: true }
  ],
  monthlyBudget: 3000,
  categoryBudgets: [
    { category: "Alimentação", limit: 800 },
    { category: "Transporte", limit: 400 },
    { category: "Lazer", limit: 500 }
  ]
};

function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Erro ao ler banco de dados JSON:", err);
    return DEFAULT_DB;
  }
}

function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erro ao gravar banco de dados JSON:", err);
    return false;
  }
}

// Database Sync Endpoints
app.get("/api/db", (req, res) => {
  const dbData = readDatabase();
  res.json(dbData);
});

app.post("/api/db/sync", (req, res) => {
  try {
    const { transactions, bills, monthlyBudget, categoryBudgets } = req.body;
    const currentDb = readDatabase();
    
    const updatedDb = {
      transactions: transactions !== undefined ? transactions : currentDb.transactions,
      bills: bills !== undefined ? bills : currentDb.bills,
      monthlyBudget: monthlyBudget !== undefined ? monthlyBudget : currentDb.monthlyBudget,
      categoryBudgets: categoryBudgets !== undefined ? categoryBudgets : currentDb.categoryBudgets,
    };

    writeDatabase(updatedDb);
    res.json({ success: true, message: "Banco de dados sincronizado com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao sincronizar banco de dados: " + err.message });
  }
});

// Database Structural Query Engine
app.get("/api/db/query", (req, res) => {
  try {
    const startTime = Date.now();
    const dbData = readDatabase();
    
    const { 
      search, 
      category, 
      type, 
      minAmount, 
      maxAmount, 
      startDate, 
      endDate,
      targetTable
    } = req.query;

    let results: any = {
      transactions: [...dbData.transactions],
      bills: [...dbData.bills]
    };

    // Filter transactions
    if (targetTable === "transactions" || !targetTable || targetTable === "all") {
      let tx = [...dbData.transactions];
      if (search) {
        const s = String(search).toLowerCase();
        tx = tx.filter(t => t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
      }
      if (category && category !== "all") {
        tx = tx.filter(t => t.category === String(category));
      }
      if (type && type !== "all") {
        tx = tx.filter(t => t.type === String(type));
      }
      if (minAmount) {
        tx = tx.filter(t => t.amount >= Number(minAmount));
      }
      if (maxAmount) {
        tx = tx.filter(t => t.amount <= Number(maxAmount));
      }
      if (startDate) {
        tx = tx.filter(t => t.date >= String(startDate));
      }
      if (endDate) {
        tx = tx.filter(t => t.date <= String(endDate));
      }
      results.transactions = tx;
    } else {
      results.transactions = [];
    }

    // Filter bills
    if (targetTable === "bills" || !targetTable || targetTable === "all") {
      let bl = [...dbData.bills];
      if (search) {
        const s = String(search).toLowerCase();
        bl = bl.filter(b => b.name.toLowerCase().includes(s));
      }
      if (minAmount) {
        bl = bl.filter(b => b.amount >= Number(minAmount));
      }
      if (maxAmount) {
        bl = bl.filter(b => b.amount <= Number(maxAmount));
      }
      results.bills = bl;
    } else {
      results.bills = [];
    }

    const queryTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        queryTimeMs,
        rowsScanned: dbData.transactions.length + dbData.bills.length,
        rowsReturned: results.transactions.length + results.bills.length,
        schema: {
          transactions: {
            id: "TEXT (PRIMARY KEY)",
            description: "TEXT",
            amount: "REAL",
            type: "TEXT (income | expense)",
            category: "TEXT",
            date: "TEXT (YYYY-MM-DD)"
          },
          bills: {
            id: "TEXT (PRIMARY KEY)",
            name: "TEXT",
            amount: "REAL",
            dueDate: "TEXT (YYYY-MM-DD)",
            paid: "BOOLEAN",
            recurring: "BOOLEAN"
          }
        }
      },
      results
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erro no motor de consulta: " + err.message });
  }
});

// Lazy load Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Advisor Endpoints
app.post("/api/ai-advisor/insights", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Serviço de IA indisponível. Configure a chave GEMINI_API_KEY nos Secrets.",
      });
    }

    const { transactions, bills, monthlyBudget, totalIncome } = req.body;

    const financialDataStr = JSON.stringify({
      monthlyBudgetLimit: monthlyBudget,
      totalIncome: totalIncome,
      transactions: transactions || [],
      bills: bills || []
    }, null, 2);

    const systemInstruction = `Você é o "Finan", o Assistente Financeiro IA do aplicativo de Finanças Pessoais. 
Seu objetivo é analisar os dados financeiros do usuário (receitas, despesas, limite de orçamento e contas fixas) e fornecer um relatório detalhado de saúde financeira em formato JSON.
Seja amigável, motivador e dê conselhos práticos e realistas em Português do Brasil.
Se não houver transações ou contas, incentive o usuário a começar a cadastrar seus dados para obter insights personalizados.`;

    const prompt = `Analise os seguintes dados financeiros do usuário e gere o relatório de saúde financeira:
${financialDataStr}

Forneça a resposta seguindo estritamente o esquema JSON solicitado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Um resumo conciso de 3 a 4 frases sobre a situação financeira atual, parabenizando acertos ou apontando onde focar atenção.",
            },
            financialHealthScore: {
              type: Type.INTEGER,
              description: "Uma pontuação de 0 a 100 representando a saúde financeira com base no orçamento disponível, gastos e contas pagas.",
            },
            tips: {
              type: Type.ARRAY,
              description: "Lista de 3 a 4 dicas personalizadas baseadas nos dados.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Título curto e chamativo da dica." },
                  description: { type: Type.STRING, description: "Explicação detalhada e prática." },
                  category: { 
                    type: Type.STRING, 
                    description: "Categoria da dica. Use apenas: 'Economia', 'Alerta', 'Planejamento', 'Investimento'" 
                  }
                },
                required: ["title", "description", "category"]
              }
            },
            categoryAnalysis: {
              type: Type.ARRAY,
              description: "Análise rápida das principais categorias de gastos que aparecem nas transações.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Nome da categoria analisada (ex: Alimentação, Transporte, Lazer)." },
                  comment: { type: Type.STRING, description: "Comentário curto sobre o volume de gastos nesta categoria." },
                  status: { 
                    type: Type.STRING, 
                    description: "Status do gasto. Use apenas: 'good' (adequado/baixo), 'warning' (atenção/crescendo), 'critical' (muito alto/estourou)." 
                  }
                },
                required: ["category", "comment", "status"]
              }
            }
          },
          required: ["summary", "financialHealthScore", "tips", "categoryAnalysis"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    const data = JSON.parse(text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: error.message || "Erro ao processar insights financeiros." });
  }
});

app.post("/api/ai-advisor/chat", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Serviço de IA indisponível. Configure a chave GEMINI_API_KEY nos Secrets.",
      });
    }

    const { message, history, transactions, bills, monthlyBudget, totalIncome } = req.body;

    const financialDataStr = JSON.stringify({
      monthlyBudgetLimit: monthlyBudget,
      totalIncome: totalIncome,
      transactions: transactions || [],
      bills: bills || []
    });

    const systemInstruction = `Você é o "Finan", o Assistente Financeiro IA integrado ao aplicativo de Finanças Pessoais. 
Você tem acesso aos dados financeiros atuais do usuário em tempo real: ${financialDataStr}.
Quando o usuário perguntar algo sobre seus gastos, receitas ou planejamento, use esses dados para responder de forma precisa e personalizada.
Diga coisas realistas, seja empático, prático e fale como um planejador financeiro certificado do Brasil. 
Use markdown simples (como negritos e listas) nas respostas. Mantenha as respostas curtas, focadas e objetivas (máximo de 3 parágrafos).`;

    // We can use a standard generateContent call, passing the context and history
    const contents = [];
    
    // Add history if present
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    res.status(500).json({ error: error.message || "Erro ao processar chat com a IA." });
  }
});

// Configure Vite or Static files depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
