"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountsAction } from "@/actions/accounts";
import { getCategoriesAction } from "@/actions/categories";
import { getTransactionsAction, importTransactionsAction } from "@/actions/transactions";
import TransactionDialog from "@/components/transaction-dialog";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { CATEGORY_ICONS } from "@/components/category-dialog";
import { ArrowRight, ArrowLeftRight, Tag, Search, SlidersHorizontal, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const initialAccount = searchParams.get("account") || null;
  const queryClient = useQueryClient();

  // 1. Filter, Search, and Import States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccountId, setFilterAccountId] = useState<string | null>(initialAccount);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Sync state if query parameters change (e.g. user navigates from Account Card link)
  useEffect(() => {
    setFilterAccountId(searchParams.get("account") || null);
  }, [searchParams]);

  // 2. React Query parallel fetches
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

  // Import Mutation
  const importMutation = useMutation({
    mutationFn: importTransactionsAction,
    onSuccess: (res: any) => {
      if (res.success) {
        setImportDrawerOpen(false);
        setSelectedFile(null);
        const count = res.count ?? 0;
        const skipped = res.skipped ?? 0;
        alert(`Import completed! Successfully imported ${count} transactions.${skipped > 0 ? ` ${skipped} invalid rows were skipped.` : ""}`);
        
        // Invalidate all related caches to trigger a UI refresh
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      } else {
        setImportError(res.error || "Failed to import transactions.");
      }
    },
    onError: (err: any) => {
      setImportError(err?.message || "An unexpected error occurred.");
    },
  });

  const isLoading = accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading;
  const error = accountsQuery.error || categoriesQuery.error || transactionsQuery.error;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full animate-pulse">
        <div className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="h-10 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 border border-zinc-800 bg-zinc-900/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <p className="text-sm text-destructive">Failed to load transactions.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message || "Unexpected error occurred."}</p>
      </div>
    );
  }

  const accountsList = accountsQuery.data || [];
  const categoriesList = categoriesQuery.data || [];
  const transactionsList = transactionsQuery.data || [];

  const hasActiveFilters =
    !!filterAccountId ||
    !!filterCategoryId ||
    filterType !== "all" ||
    !!startDate ||
    !!endDate;

  const handleClearFilters = () => {
    setFilterAccountId(null);
    setFilterCategoryId(null);
    setFilterType("all");
    setStartDate("");
    setEndDate("");
  };

  // 3. Client-side filtration logic
  const filteredTransactions = transactionsList.filter((tx) => {
    // Description / Search Matching
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const descMatch = tx.description?.toLowerCase().includes(query);
      const catMatch = tx.categoryName?.toLowerCase().includes(query);
      const accMatch = tx.accountName?.toLowerCase().includes(query);
      const targetAccMatch = tx.toAccountName?.toLowerCase().includes(query);
      if (!descMatch && !catMatch && !accMatch && !targetAccMatch) {
        return false;
      }
    }

    // Account matches (check either source or destination account for transfers)
    if (filterAccountId) {
      if (tx.accountId !== filterAccountId && tx.toAccountId !== filterAccountId) {
        return false;
      }
    }

    // Category matches
    if (filterCategoryId) {
      if (tx.categoryId !== filterCategoryId) {
        return false;
      }
    }

    // Flow type matches
    if (filterType !== "all") {
      if (tx.type !== filterType) {
        return false;
      }
    }

    // Date range boundaries
    const txDate = new Date(tx.date);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }

    return true;
  });

  // Group filtered transactions by date (YYYY-MM-DD string)
  const groupedTransactions: Record<string, typeof filteredTransactions> = {};
  filteredTransactions.forEach((tx) => {
    const dateStr = new Date(tx.date).toISOString().split("T")[0];
    if (!groupedTransactions[dateStr]) {
      groupedTransactions[dateStr] = [];
    }
    groupedTransactions[dateStr].push(tx);
  });

  const formatDateHeader = (dateString: string) => {
    const dateObj = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return dateObj.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // 4. Export logic
  const escapeCSV = (str: string) => {
    if (!str) return "";
    const escaped = str.replace(/"/g, '""');
    return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
      ? `"${escaped}"`
      : escaped;
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Amount", "Category", "Account", "ToAccount", "Description"];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.date).toISOString().split("T")[0],
      tx.type,
      tx.amount,
      tx.categoryName || "",
      tx.accountName || "",
      tx.toAccountName || "",
      tx.description || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => escapeCSV(val)).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ledger_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Import parsing & triggers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportError(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    
    const dateIdx = headers.findIndex((h) => h.toLowerCase() === "date");
    const typeIdx = headers.findIndex((h) => h.toLowerCase() === "type");
    const amountIdx = headers.findIndex((h) => h.toLowerCase() === "amount");
    const categoryIdx = headers.findIndex((h) => h.toLowerCase() === "category");
    const accountIdx = headers.findIndex((h) => h.toLowerCase() === "account");
    const toAccountIdx = headers.findIndex((h) => h.toLowerCase() === "toaccount");
    const descIdx = headers.findIndex((h) => h.toLowerCase() === "description");

    if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1 || accountIdx === -1) {
      throw new Error("Missing required headers in CSV. Required fields: Date, Type, Amount, Account.");
    }

    const list: Array<any> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted commas properly
      const values: string[] = [];
      let currentVal = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentVal.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          currentVal = "";
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

      const date = values[dateIdx];
      const type = values[typeIdx];
      const amount = values[amountIdx];
      const accountName = values[accountIdx];

      if (!date || !type || !amount || !accountName) continue;

      list.push({
        date,
        type: type.toLowerCase(),
        amount,
        accountName,
        categoryName: categoryIdx !== -1 ? values[categoryIdx] : undefined,
        toAccountName: toAccountIdx !== -1 ? values[toAccountIdx] : undefined,
        description: descIdx !== -1 ? values[descIdx] : undefined,
      });
    }

    return list;
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        setImportError("Failed to read file.");
        return;
      }

      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportError("No transactions found in CSV file.");
          return;
        }
        importMutation.mutate(parsed);
      } catch (err: any) {
        setImportError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ledger</h1>
          <p className="text-sm text-muted-foreground">Monitor and track your cash flows chronologically.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Action */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-10 px-3.5 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 rounded-lg active:scale-95 duration-200 flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
            title="Export Ledger to CSV"
          >
            <Download className="size-4" />
            <span>Export</span>
          </Button>

          {/* Import Action */}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setImportError(null);
              setImportDrawerOpen(true);
            }}
            className="h-10 px-3.5 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 rounded-lg active:scale-95 duration-200 flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
            title="Import Ledger from CSV"
          >
            <Upload className="size-4" />
            <span>Import</span>
          </Button>

          {accountsList.length > 0 && (
            <TransactionDialog accountsList={accountsList} categoriesList={categoriesList} />
          )}
        </div>
      </div>

      {accountsList.length === 0 ? (
        <div className="border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
          <p className="text-sm text-muted-foreground">No accounts found.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            You must create an account first in the{" "}
            <Link href="/accounts" className="text-[#10b981] underline">
              Accounts Section
            </Link>{" "}
            before you can log transactions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Search & Filter Row */}
          <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search description, account, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg placeholder:text-zinc-500 text-sm font-semibold"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilterDrawerOpen(true)}
              className={cn(
                "h-10 px-3.5 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 rounded-lg active:scale-95 duration-200 flex items-center gap-2",
                hasActiveFilters && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              )}
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Filters</span>
              {hasActiveFilters && (
                <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </Button>
          </div>

          {/* Ledger Lists */}
          {filteredTransactions.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900/50 p-8 rounded-xl flex flex-col items-center justify-center min-h-[200px] text-center">
              <p className="text-sm text-zinc-400">No transactions matched your filters.</p>
              <p className="text-xs text-zinc-500 mt-1">
                Try clearing search strings or filters inside the drawer.
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="mt-4 border-zinc-800 text-zinc-400 hover:text-zinc-50 h-9 px-3 rounded-lg text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(groupedTransactions).map(([dateStr, txs]) => (
                <div key={dateStr} className="flex flex-col gap-2">
                  {/* Day Header */}
                  <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800 pb-1 select-none">
                    {formatDateHeader(dateStr)}
                  </h3>

                  {/* Transactions of the day */}
                  <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden divide-y divide-zinc-800">
                    {txs.map((tx) => {
                      const amountVal = parseFloat(tx.amount);
                      
                      // Resolve Icon & Color
                      let IconComponent = Tag;
                      let iconColor = "#71717a"; // zinc-500 default
                      if (tx.type === "transfer") {
                        IconComponent = ArrowLeftRight;
                        iconColor = "#a1a1aa"; // zinc-400
                      } else if (tx.categoryIcon) {
                        IconComponent = CATEGORY_ICONS[tx.categoryIcon as keyof typeof CATEGORY_ICONS] || Tag;
                        iconColor = tx.categoryColor || iconColor;
                      }

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 hover:bg-zinc-800/10 transition-colors duration-200 gap-4"
                        >
                          {/* Left details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="size-10 rounded-md flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${iconColor}15`,
                                color: iconColor,
                              }}
                            >
                              <IconComponent className="size-5" />
                            </div>

                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold truncate text-zinc-50">
                                {tx.type === "transfer"
                                  ? "Transfer"
                                  : tx.categoryName || "Uncategorized"}
                              </span>
                              {tx.description && (
                                <span className="text-xs text-zinc-400 truncate max-w-[200px] md:max-w-xs mt-0.5">
                                  {tx.description}
                                </span>
                              )}
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400/60 mt-1 font-mono uppercase">
                                <span>{tx.accountName}</span>
                                {tx.type === "transfer" && (
                                  <>
                                    <ArrowRight className="size-3 shrink-0" />
                                    <span>{tx.toAccountName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Amount & Delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={cn(
                                "text-sm font-black tracking-tight",
                                tx.type === "expense"
                                  ? "text-red-500"
                                  : tx.type === "income"
                                  ? "text-emerald-500"
                                  : "text-zinc-50"
                              )}
                            >
                              {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                              ₹{amountVal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <DeleteTransactionButton transactionId={tx.id} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILTER DRAWER DIALOG */}
      <Dialog open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50 flex items-center gap-2 select-none">
              <SlidersHorizontal className="size-5 text-emerald-500" />
              Filter Ledger
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 mt-4">
            {/* Flow Type selector */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none">
                Flow Type
              </span>
              <div className="grid grid-cols-4 gap-1 bg-zinc-900/50 p-1 border border-zinc-800 rounded-lg">
                {(["all", "income", "expense", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={cn(
                      "py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95 duration-100 cursor-pointer",
                      filterType === t
                        ? "bg-zinc-50 text-zinc-950"
                        : "text-zinc-400 hover:text-zinc-50"
                    )}
                  >
                    {t === "all" ? "All" : t === "income" ? "In" : t === "expense" ? "Out" : "Xfer"}
                  </button>
                ))}
              </div>
            </div>

            {/* Account selector */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="filter-account" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none">
                Account
              </Label>
              <select
                id="filter-account"
                value={filterAccountId || ""}
                onChange={(e) => setFilterAccountId(e.target.value || null)}
                className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg font-semibold w-full text-sm outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="">All Accounts</option>
                {accountsList.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category selector */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="filter-category" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none">
                Category
              </Label>
              <select
                id="filter-category"
                value={filterCategoryId || ""}
                onChange={(e) => setFilterCategoryId(e.target.value || null)}
                className="h-11 px-3 bg-zinc-900/50 border border-zinc-800 text-zinc-50 rounded-lg font-semibold w-full text-sm outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range selectors */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider select-none">
                Date Range
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="start-date" className="text-[10px] text-zinc-500 font-bold uppercase select-none">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="end-date" className="text-[10px] text-zinc-500 font-bold uppercase select-none">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 bg-zinc-900/50 border-zinc-800 text-zinc-50 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center gap-3 mt-3 border-t border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="h-11 px-4 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 transition-all rounded-lg duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
              >
                Clear All
              </Button>
              <Button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="h-11 px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 transition-all rounded-lg duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog open={importDrawerOpen} onOpenChange={setImportDrawerOpen}>
        <DialogContent className="max-w-sm border border-zinc-800 bg-zinc-950 p-6 text-zinc-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50 flex items-center gap-2 select-none">
              <Upload className="size-5 text-emerald-500" />
              Import Transactions
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5 mt-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload a CSV file containing your transaction logs. The CSV headers must include: <strong className="text-zinc-200">Date, Type, Amount, Account</strong>. Missing accounts and categories will be created automatically.
            </p>

            {importError && (
              <div className="border border-destructive bg-destructive/10 p-3 text-xs text-destructive rounded-lg">
                {importError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="csv-file" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Choose CSV File
              </Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
                className="h-12 bg-zinc-900/50 border-zinc-800 text-zinc-50 text-xs flex items-center pt-2.5 cursor-pointer file:bg-zinc-800 file:text-zinc-50 file:border-0 file:rounded-md file:text-[10px] file:font-bold file:uppercase file:px-2 file:py-1 file:mr-3"
              />
            </div>

            <div className="flex justify-between items-center gap-3 mt-3 border-t border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => setImportDrawerOpen(false)}
                className="h-11 px-4 border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/30 transition-all rounded-lg duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={importMutation.isPending || !selectedFile}
                onClick={handleUpload}
                className="h-11 px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 transition-all rounded-lg duration-200 active:scale-95 text-xs font-bold uppercase tracking-wider"
              >
                {importMutation.isPending ? "Importing..." : "Upload & Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
