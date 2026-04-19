import React, { useMemo, useState } from "react";
import {
  ReceiptData,
  AssignmentMap,
  PersonSummary,
  DistributionMethod,
  ItemOverridesMap,
  HistoryEntry,
  ItemManualSplitsMap,
} from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  ClipboardCheck,
  Download,
  FileText,
  DollarSign,
  Smartphone,
  ExternalLink,
  CreditCard,
  ArrowUpRight,
  Check,
  Copy,
  Save,
} from "lucide-react";

interface SummaryDisplayProps {
  receiptData: ReceiptData | null;
  assignments: AssignmentMap;
  itemManualSplits?: ItemManualSplitsMap;
  distributionMethod: DistributionMethod;
  itemOverrides?: ItemOverridesMap;
  onSaveHistory?: (entry: HistoryEntry) => void;
  isSaved?: boolean;
}

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
];

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({
  receiptData,
  assignments,
  itemManualSplits = {},
  distributionMethod,
  itemOverrides = {},
  onSaveHistory,
  isSaved = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const summary = useMemo<PersonSummary[]>(() => {
    if (!receiptData) return [];

    const peopleMap: Record<string, PersonSummary> = {};
    const initPerson = (name: string) => {
      if (!peopleMap[name])
        peopleMap[name] = {
          name,
          items: [],
          subtotal: 0,
          taxShare: 0,
          tipShare: 0,
          totalOwed: 0,
        };
    };

    let totalManualTax = 0;
    let totalManualTip = 0;
    let subtotalOfItemsWithNoTaxOverride = 0;
    let subtotalOfItemsWithNoTipOverride = 0;

    // First pass: Track subtotal and assigned items
    receiptData.items.forEach((item) => {
      const override = itemOverrides[item.id];
      if (distributionMethod === "MANUAL") {
        if (override?.tax !== undefined) totalManualTax += override.tax;
        else subtotalOfItemsWithNoTaxOverride += item.price;

        if (override?.tip !== undefined) totalManualTip += override.tip;
        else subtotalOfItemsWithNoTipOverride += item.price;
      }
    });

    const remainingTaxPool = Math.max(0, receiptData.tax - totalManualTax);
    const remainingTipPool = Math.max(0, receiptData.tip - totalManualTip);

    // Second pass: Calculate shares for each person
    receiptData.items.forEach((item) => {
      const assignedPeople = assignments[item.id] || [];
      const manualSplits = itemManualSplits[item.id];
      const splitCount = assignedPeople.length;
      const override = itemOverrides[item.id];

      if (splitCount > 0) {
        let itemTax = 0;
        let itemTip = 0;

        if (distributionMethod === "MANUAL") {
          if (override?.tax !== undefined) {
            itemTax = override.tax;
          } else if (subtotalOfItemsWithNoTaxOverride > 0) {
            itemTax =
              (item.price / subtotalOfItemsWithNoTaxOverride) *
              remainingTaxPool;
          }

          if (override?.tip !== undefined) {
            itemTip = override.tip;
          } else if (subtotalOfItemsWithNoTipOverride > 0) {
            itemTip =
              (item.price / subtotalOfItemsWithNoTipOverride) *
              remainingTipPool;
          }
        }

        assignedPeople.forEach((person) => {
          initPerson(person);

          const amountForThisPerson =
            manualSplits?.[person] !== undefined
              ? manualSplits[person]
              : item.price / splitCount;

          peopleMap[person].items.push({
            description:
              item.description +
              (manualSplits
                ? " (Custom)"
                : splitCount > 1
                  ? ` (1/${splitCount})`
                  : ""),
            amount: amountForThisPerson,
          });
          peopleMap[person].subtotal += amountForThisPerson;

          if (distributionMethod === "MANUAL") {
            const ratio =
              item.price > 0
                ? amountForThisPerson / item.price
                : 1 / splitCount;
            peopleMap[person].taxShare += itemTax * ratio;
            peopleMap[person].tipShare += itemTip * ratio;
          }
        });
      }
    });

    // Handle unassigned items
    const assignedItemIds = new Set(
      Object.keys(assignments).filter((k) => assignments[k].length > 0),
    );
    const unassignedItems = receiptData.items.filter(
      (item) => !assignedItemIds.has(item.id),
    );

    if (unassignedItems.length > 0) {
      initPerson("Unassigned");
      unassignedItems.forEach((item) => {
        const override = itemOverrides[item.id];
        peopleMap["Unassigned"].items.push({
          description: item.description,
          amount: item.price,
        });
        peopleMap["Unassigned"].subtotal += item.price;

        if (distributionMethod === "MANUAL") {
          if (override?.tax !== undefined) {
            peopleMap["Unassigned"].taxShare += override.tax;
          } else if (subtotalOfItemsWithNoTaxOverride > 0) {
            peopleMap["Unassigned"].taxShare +=
              (item.price / subtotalOfItemsWithNoTaxOverride) *
              remainingTaxPool;
          }

          if (override?.tip !== undefined) {
            peopleMap["Unassigned"].tipShare += override.tip;
          } else if (subtotalOfItemsWithNoTipOverride > 0) {
            peopleMap["Unassigned"].tipShare +=
              (item.price / subtotalOfItemsWithNoTipOverride) *
              remainingTipPool;
          }
        }
      });
    }

    const peopleList = Object.values(peopleMap);
    const totalAssignedSubtotal = receiptData.subtotal || 1;
    const realPeopleCount = peopleList.filter(
      (p) => p.name !== "Unassigned",
    ).length;

    peopleList.forEach((person) => {
      if (distributionMethod === "PROPORTIONAL") {
        const shareRatio = person.subtotal / totalAssignedSubtotal;
        person.taxShare = receiptData.tax * shareRatio;
        person.tipShare = receiptData.tip * shareRatio;
      } else if (distributionMethod === "EQUAL") {
        if (person.name !== "Unassigned") {
          const count = realPeopleCount > 0 ? realPeopleCount : 1;
          person.taxShare = receiptData.tax / count;
          person.tipShare = receiptData.tip / count;
        }
      }
      person.totalOwed = person.subtotal + person.taxShare + person.tipShare;
    });

    return peopleList.sort((a, b) => b.totalOwed - a.totalOwed);
  }, [
    receiptData,
    assignments,
    itemManualSplits,
    distributionMethod,
    itemOverrides,
  ]);

  const realPeopleCount = useMemo(
    () => summary.filter((p) => p.name !== "Unassigned").length,
    [summary],
  );

  const topPerson = summary[0];

  const handleSave = () => {
    if (!receiptData || !onSaveHistory) return;
    const participants = summary
      .filter((p) => p.name !== "Unassigned")
      .map((p) => p.name);
    onSaveHistory({
      id: Date.now().toString(),
      timestamp: Date.now(),
      receiptData,
      assignments,
      itemManualSplits,
      participants,
      itemCount: receiptData.items.length,
      total: receiptData.total,
      currency: receiptData.currency,
      distributionMethod,
    });
  };

  const handleExportCSV = () => {
    if (!receiptData) return;
    let csv = "Name,Subtotal,Tax Share,Tip Share,Total Owed\n";
    summary.forEach(p => {
      csv += `${p.name},${p.subtotal.toFixed(2)},${p.taxShare.toFixed(2)},${p.tipShare.toFixed(2)},${p.totalOwed.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getPaymentLink = (person: string, amount: number, method: 'venmo' | 'paypal' | 'cashapp') => {
    const cleanName = person.replace(/\s+/g, '').toLowerCase();
    const formattedAmount = amount.toFixed(2);
    const note = encodeURIComponent(`SplitSmart - Bill Split`);
    
    switch (method) {
      case 'venmo': return `venmo://paycharge?txn=pay&recipients=${cleanName}&amount=${formattedAmount}&note=${note}`;
      case 'paypal': return `https://paypal.me/${cleanName}/${formattedAmount}`;
      case 'cashapp': return `https://cash.app/$${cleanName}/${formattedAmount}`;
      default: return '';
    }
  };

  const handleCopySummary = () => {
    if (!receiptData) return;
    let text = `Bill Split Summary: ${receiptData.venue || "Receipt"}\n\n`;
    summary.forEach((p) => {
      text += `${p.name}: ${receiptData.currency}${p.totalOwed.toFixed(2)}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!receiptData)
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 border border-dashed border-slate-200 rounded-3xl">
        <CreditCard size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">
          Summary will appear here
        </p>
      </div>
    );

  const chartData = summary.map((p, index) => ({
    name: p.name,
    value: p.totalOwed,
    color: p.name === "Unassigned" ? "#cbd5e1" : COLORS[index % COLORS.length],
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col animate-in fade-in duration-700 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Settlement Summary</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={handleExportCSV}
              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              title="Export CSV"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              title="Export PDF / Print"
            >
              <Download size={16} />
            </button>
          </div>
          <button
            onClick={handleCopySummary}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCopied
                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
            }`}
            disabled={!receiptData}
          >
            {isCopied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
            {isCopied ? "Copied" : "Copy"}
          </button>
          {onSaveHistory && (
            <button
              onClick={handleSave}
              disabled={isSaved || !receiptData}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSaved || !receiptData
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              }`}
            >
              {isSaved ? <Check size={14} /> : <Save size={14} />}
              {isSaved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
                itemStyle={{ fontSize: "10px", fontWeight: "bold" }}
                labelStyle={{ fontWeight: "bold" }}
                formatter={(
                  value: number | string | undefined,
                  name: string | undefined,
                ) => [
                  `${receiptData.currency}${Number(value || 0).toFixed(2)}`,
                  name || "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Top Contributor
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            {topPerson ? topPerson.name : "N/A"}
            {topPerson && (
              <ArrowUpRight size={20} className="text-indigo-500" />
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The total is split between <b>{realPeopleCount}</b> people.{" "}
            {summary.some((p) => p.name === "Unassigned") &&
              "Some items are still unassigned."}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
        {summary.map((person, idx) => (
          <div
            key={person.name}
            className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
              person.name === "Unassigned"
                ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-dashed opacity-80"
                : "bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      person.name === "Unassigned"
                        ? "#cbd5e1"
                        : COLORS[idx % COLORS.length],
                  }}
                ></div>
                <span
                  className={`font-bold tracking-tight ${
                    person.name === "Unassigned"
                      ? "text-slate-400 italic"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {person.name}
                </span>
              </div>
              <span className="font-black text-indigo-600 dark:text-indigo-400">
                {receiptData.currency}
                {person.totalOwed.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">
                <div className="text-[8px] font-bold text-slate-400 uppercase">
                  Items
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {receiptData.currency}
                  {person.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-indigo-50/30 dark:bg-indigo-900/20 px-3 py-2 rounded-xl">
                <div className="text-[8px] font-bold text-slate-400 uppercase">
                  Tax & Tip
                </div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {receiptData.currency}
                  {(person.taxShare + person.tipShare).toFixed(2)}
                </div>
              </div>
            </div>

            {person.name !== "Unassigned" && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase mr-auto">
                  Settle via:
                </div>
                <button
                  onClick={() => window.open(getPaymentLink(person.name, person.totalOwed, 'venmo'), '_blank')}
                  className="p-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-100 transition-colors"
                  title="Venmo"
                >
                  <Smartphone size={14} />
                </button>
                <button
                  onClick={() => window.open(getPaymentLink(person.name, person.totalOwed, 'paypal'), '_blank')}
                  className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                  title="PayPal"
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => window.open(getPaymentLink(person.name, person.totalOwed, 'cashapp'), '_blank')}
                  className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors"
                  title="Cash App"
                >
                  <DollarSign size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryDisplay;
