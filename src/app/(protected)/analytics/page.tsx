"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import { getTransactionsAction } from "@/actions/transactions";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  BarChart2,
  Tag,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // 1. Fetch data
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await getAccountsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getTransactionsAction();
      if (!res.success) throw new Error(res.error);
      return res.data || [];
    },
  });

  const isLoading = accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading;
  const error = accountsQuery.error || categoriesQuery.error || transactionsQuery.error;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          <div className="h-24 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          <div className="h-24 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="h-72 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          <div className="h-72 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load analytics data.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  const categoriesList = categoriesQuery.data || [];
  const transactionsList = transactionsQuery.data || [];

  // 2. Drive Current Month boundaries
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + currentMonthOffset);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth(); // 0-indexed

  const monthLabel = targetDate.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Filter transactions for target month
  const monthlyTransactions = transactionsList.filter((tx) => {
    const d = new Date(tx.date);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  // Calculate Income / Expense / Transfer Summary
  const monthlyIncome = monthlyTransactions
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  const monthlyExpense = monthlyTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;

  // 3. Category Breakdowns for Expenses
  const categoryExpenses: Record<string, { amount: number; color: string; icon: string; name: string }> = {};

  // Initialize all expense categories with 0.00
  categoriesList
    .filter((c) => c.type === "expense")
    .forEach((cat) => {
      categoryExpenses[cat.id] = {
        amount: 0,
        color: cat.color,
        icon: cat.icon,
        name: cat.name,
      };
    });

  // Aggregate
  let uncategorizedAmount = 0;
  monthlyTransactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      if (tx.categoryId && categoryExpenses[tx.categoryId]) {
        categoryExpenses[tx.categoryId].amount += parseFloat(tx.amount);
      } else {
        uncategorizedAmount += parseFloat(tx.amount);
      }
    });

  // Compile breakdown list
  const breakdownList = Object.entries(categoryExpenses)
    .map(([id, details]) => ({
      id,
      ...details,
    }))
    .filter((c) => c.amount > 0);

  if (uncategorizedAmount > 0) {
    breakdownList.push({
      id: "uncategorized",
      amount: uncategorizedAmount,
      color: "#71717a", // zinc-500
      icon: "Tag",
      name: "Uncategorized",
    });
  }

  // Sort descending
  breakdownList.sort((a, b) => b.amount - a.amount);

  // Compute angles for Donut chart
  let accumulatedPercentage = 0;
  const donutSegments = breakdownList.map((item) => {
    const percentage = monthlyExpense > 0 ? (item.amount / monthlyExpense) * 100 : 0;
    const startAngle = (accumulatedPercentage / 100) * 360 - 90;
    accumulatedPercentage += percentage;
    return {
      ...item,
      percentage,
      startAngle,
    };
  });

  // 4. Compute 6-Month Historical Trends
  const historicalData: Array<{ monthLabel: string; income: number; expense: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yr = d.getFullYear();
    const mo = d.getMonth();

    const label = d.toLocaleString("en-IN", { month: "short" });

    const txs = transactionsList.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === yr && txDate.getMonth() === mo;
    });

    const inc = txs.filter((tx) => tx.type === "income").reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
    const exp = txs.filter((tx) => tx.type === "expense").reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

    historicalData.push({
      monthLabel: label,
      income: inc,
      expense: exp,
    });
  }

  // Find max historical value to scale chart height
  const maxVal = Math.max(
    ...historicalData.map((h) => Math.max(h.income, h.expense)),
    1000 // default min boundary
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-border pb-5 gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Analytics</h1>
          <p className="text-sm text-muted-foreground select-none">Gain visual insights into your cash flows.</p>
        </div>

        <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-lg p-1 select-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonthOffset((o) => o - 1)}
            className="size-8 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md active:scale-95 duration-200 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-3 text-xs font-bold text-zinc-300 uppercase tracking-widest text-center min-w-[120px]">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonthOffset((o) => o + 1)}
            className="size-8 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-md active:scale-95 duration-200 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl flex items-center justify-between select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Income</span>
            <span className="text-lg font-black tracking-tight text-emerald-500">
              ₹{monthlyIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="size-9 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="size-4" />
          </div>
        </div>

        {/* Expenses Card */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl flex items-center justify-between select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Expenses</span>
            <span className="text-lg font-black tracking-tight text-red-500">
              ₹{monthlyExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="size-9 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
            <TrendingDown className="size-4" />
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="border border-zinc-800 bg-zinc-900/50 p-5 rounded-xl flex items-center justify-between select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Savings Rate</span>
            <span
              className={cn(
                "text-lg font-black tracking-tight",
                netSavings >= 0 ? "text-zinc-50" : "text-amber-500"
              )}
            >
              {savingsRate >= 0 ? "+" : ""}
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center text-xs font-black",
              netSavings >= 0 ? "bg-zinc-800 text-zinc-300" : "bg-amber-500/10 text-amber-500"
            )}
          >
            {netSavings >= 0 ? "SUR" : "DEF"}
          </div>
        </div>
      </div>

      {/* Main Visual Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Category Breakdown SVG Donut */}
        <div className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-xl flex flex-col gap-5">
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide flex items-center gap-2 select-none">
            <PieIcon className="size-4 text-emerald-500" />
            Category Breakdown
          </h2>

          {donutSegments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] border border-dashed border-zinc-800 rounded-xl text-center p-4">
              <p className="text-xs text-zinc-400">No expenses logged in {monthLabel}.</p>
              <p className="text-[10px] text-zinc-500 mt-1">Breakdown visualizations will render once outflows are tracked.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
              {/* SVG Donut */}
              <div className="relative size-32 shrink-0 select-none">
                <svg width="100%" height="100%" viewBox="0 0 120 120" className="rotate-0">
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={seg.id}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray="314.16"
                      strokeDashoffset={314.16 - (seg.percentage / 100) * 314.16}
                      style={{
                        transform: `rotate(${seg.startAngle}deg)`,
                        transformOrigin: "60px 60px",
                        transition: "all 0.5s ease",
                      }}
                    >
                      <title>{`${seg.name}: ${seg.percentage.toFixed(1)}%`}</title>
                    </circle>
                  ))}
                </svg>
                {/* Center cutout */}
                <div className="absolute inset-[15%] rounded-full bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Total Out</span>
                  <span className="text-xs font-black text-zinc-100 tracking-tight mt-0.5 leading-none">
                    ₹{Math.round(monthlyExpense).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 flex flex-col gap-2.5 w-full min-w-0">
                {donutSegments.slice(0, 4).map((seg) => {
                  const Icon = CATEGORY_ICONS[seg.icon as keyof typeof CATEGORY_ICONS] || Tag;
                  return (
                    <div key={seg.id} className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <Icon className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-200 truncate">{seg.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-400 shrink-0">
                        {seg.percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
                {donutSegments.length > 4 && (
                  <span className="text-[10px] text-zinc-500 font-medium italic pl-4">
                    + {donutSegments.length - 4} more categories
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6-Month Comparison Trends SVG Bar Chart */}
        <div className="border border-zinc-800 bg-zinc-900/40 p-6 rounded-xl flex flex-col gap-5">
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide flex items-center gap-2 select-none">
            <BarChart2 className="size-4 text-emerald-500" />
            Monthly Cash Flow
          </h2>

          {/* SVG Bar Chart */}
          <div className="flex-1 flex flex-col justify-end min-h-[220px]">
            <div className="relative w-full h-[160px] select-none">
              <svg width="100%" height="100%" className="overflow-visible">
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                  <line
                    key={idx}
                    x1="0%"
                    y1={`${100 - ratio * 100}%`}
                    x2="100%"
                    y2={`${100 - ratio * 100}%`}
                    stroke="#27272a" // zinc-800
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Bars */}
                {historicalData.map((data, idx) => {
                  const blockWidth = 100 / historicalData.length;
                  const centerX = blockWidth * idx + blockWidth / 2;

                  const barWidth = 6;
                  const spacing = 1.5;

                  const incHeight = (data.income / maxVal) * 140; // max 140px
                  const expHeight = (data.expense / maxVal) * 140;

                  return (
                    <g key={idx}>
                      {/* Income Bar (Left) */}
                      <rect
                        x={`${centerX - barWidth - spacing}%`}
                        y={140 - incHeight}
                        width={`${barWidth}%`}
                        height={incHeight}
                        rx="1.5"
                        fill="#10b981" // emerald-500
                        opacity={data.income > 0 ? "1" : "0.05"}
                        style={{ transition: "all 0.5s ease" }}
                      />

                      {/* Expense Bar (Right) */}
                      <rect
                        x={`${centerX + spacing}%`}
                        y={140 - expHeight}
                        width={`${barWidth}%`}
                        height={expHeight}
                        rx="1.5"
                        fill="#ef4444" // red-500
                        opacity={data.expense > 0 ? "1" : "0.05"}
                        style={{ transition: "all 0.5s ease" }}
                      />

                      {/* Month Text Label */}
                      <text
                        x={`${centerX}%`}
                        y="155"
                        textAnchor="middle"
                        fill="#71717a" // zinc-500
                        fontSize="9"
                        fontWeight="bold"
                        className="uppercase font-sans tracking-wide"
                      >
                        {data.monthLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Chart Legend */}
            <div className="flex justify-center gap-4 mt-6 select-none">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Inflows</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Outflows</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category List Feed */}
      {breakdownList.length > 0 && (
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden mt-2">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 select-none">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Category Expenses Ledger</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {breakdownList.map((item) => {
              const Icon = CATEGORY_ICONS[item.icon as keyof typeof CATEGORY_ICONS] || Tag;
              const percentage = monthlyExpense > 0 ? (item.amount / monthlyExpense) * 100 : 0;
              return (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-9 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-50">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
                        {percentage.toFixed(0)}% of total expenses
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-zinc-100 tracking-tight">
                    ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
