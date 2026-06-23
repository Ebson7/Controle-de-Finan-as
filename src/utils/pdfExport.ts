import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Transaction, Bill } from "../types";

// Declare module extension to make TypeScript happy with autoTable plugin
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

export function exportMonthlyReportToPDF(
  transactions: Transaction[],
  bills: Bill[],
  monthlyBudget: number,
  userEmail: string = "ebsonsilva7@gmail.com"
) {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString("pt-BR");
  
  // Get current month name
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Color Palette (Cosmic/Midnight Theme)
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [37, 99, 235]; // Blue 600
  const textColor = [51, 65, 85]; // Slate 700

  // 1. Header Section
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FinançaPro", 15, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175); // Slate 400
  doc.text("SISTEMA DE GESTÃO FINANCEIRA PERSISTENTE", 15, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(96, 165, 250); // Blue 400
  doc.text(`Relatório Mensal - ${currentMonthName} de ${currentYear}`, 15, 37);

  // Metadata block (right aligned)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Emitido em: ${today}`, 145, 18);
  doc.text(`Usuário: ${userEmail}`, 145, 24);
  doc.text("Banco de Dados: Ativo (SQLite/JSON Sync)", 145, 30);
  doc.text("Status: Auditado", 145, 36);

  // 2. Financial Summary Cards
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Draw Summary Section Title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RESUMO FINANCEIRO DO PERÍODO", 15, 57);

  // Draw boxes for indicators
  const cardY = 62;
  const cardHeight = 22;
  const cardWidth = 43;

  // Receitas Card
  doc.setFillColor(240, 253, 244); // Light green
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 3, 3, "F");
  doc.setTextColor(21, 128, 61); // Emerald 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RECEITAS (+)", 19, cardY + 7);
  doc.setFontSize(11);
  doc.text(`R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 19, cardY + 15);

  // Despesas Card
  doc.setFillColor(254, 242, 242); // Light red
  doc.roundedRect(15 + cardWidth + 5, cardY, cardWidth, cardHeight, 3, 3, "F");
  doc.setTextColor(185, 28, 28); // Rose 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESPESAS (-)", 15 + cardWidth + 9, cardY + 7);
  doc.setFontSize(11);
  doc.text(`R$ ${totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15 + cardWidth + 9, cardY + 15);

  // Saldo Card
  doc.setFillColor(243, 244, 246); // Light slate
  doc.roundedRect(15 + (cardWidth + 5) * 2, cardY, cardWidth, cardHeight, 3, 3, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SALDO LÍQUIDO", 15 + (cardWidth + 5) * 2 + 4, cardY + 7);
  doc.setFontSize(11);
  if (netBalance >= 0) {
    doc.setTextColor(21, 128, 61); // Emerald 700
    doc.text(`R$ ${netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15 + (cardWidth + 5) * 2 + 4, cardY + 15);
  } else {
    doc.setTextColor(185, 28, 28); // Rose 700
    doc.text(`R$ ${netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15 + (cardWidth + 5) * 2 + 4, cardY + 15);
  }

  // Orçamento Card
  doc.setFillColor(239, 246, 255); // Light blue
  doc.roundedRect(15 + (cardWidth + 5) * 3, cardY, cardWidth, cardHeight, 3, 3, "F");
  doc.setTextColor(29, 78, 216); // Blue 700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("LIMITE ORÇAMENTO", 15 + (cardWidth + 5) * 3 + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(`R$ ${monthlyBudget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15 + (cardWidth + 5) * 3 + 4, cardY + 15);

  // 3. Transactions Table (Data Source)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("LANCAMENTOS E EXTRATO DE TRANSAÇÕES", 15, 96);

  const txRows = transactions.map((t, idx) => [
    t.date,
    t.description,
    t.category,
    t.type === "income" ? "Receita" : "Despesa",
    `R$ ${t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: 101,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: txRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left"
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8.5
    },
    columnStyles: {
      4: { halign: "right", fontStyle: "bold" } // Right-align value column
    },
    styles: {
      font: "helvetica",
      cellPadding: 3
    }
  });

  // 4. Active Bills / Boletos Table
  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need to add a new page
  let billsStartY = finalY;
  if (billsStartY > 220) {
    doc.addPage();
    billsStartY = 20;
  }

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CONTAS FIXAS E COMPROMISSOS DO MÊS", 15, billsStartY);

  const billsRows = bills.map(b => [
    b.name,
    b.dueDate,
    b.paid ? "Paga" : "Pendente",
    b.recurring ? "Sim" : "Não",
    `R$ ${b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: billsStartY + 5,
    head: [["Nome da Conta / Boleto", "Vencimento", "Estado", "Mensal?", "Valor"]],
    body: billsRows,
    theme: "striped",
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left"
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8.5
    },
    columnStyles: {
      4: { halign: "right", fontStyle: "bold" }
    },
    styles: {
      font: "helvetica",
      cellPadding: 3
    }
  });

  // Footer on final page
  const finalPageY = (doc as any).lastAutoTable.finalY + 15;
  if (finalPageY < 270) {
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text("Este documento foi gerado de forma segura e autônoma pelo FinançaPro.", 15, finalPageY);
    doc.text("A veracidade das informações apresentadas é de responsabilidade da base de dados persistente vinculada.", 15, finalPageY + 4);
  }

  // Save/Download PDF
  doc.save(`FinancaPro_Relatorio_${currentMonthName}_${currentYear}.pdf`);
}
