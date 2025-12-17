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
  CreditCard,
  ArrowUpRight,
  Save,
  Check,
  Copy,
  ClipboardCheck,
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

  const handleSave = () => {
    if (!receiptData || !onSaveHistory) return;
    const participants = summary
      .filter((p) => p.name !== "Unassigned")
      .map((p) => p.name);
    onSaveHistory({
      id: Date.now().toString(),
      date: Date.now(),
      total: receiptData.total,
      currency: receiptData.currency,
      participants,
      itemCount: receiptData.items.length,
    });
  };

  const handleCopySummary = async () => {
    if (!receiptData) return;

    let text = `📜 SplitSmart Settlement Summary\n`;
    text += `📅 Date: ${new Date().toLocaleDateString()}\n`;
    text += `💰 Grand Total: ${receiptData.currency}${receiptData.total.toFixed(2)}\n`;
    text += `--------------------------------\n\n`;

    summary.forEach((person) => {
      text += `${person.name.toUpperCase()}\n`;
      text += `Total: ${receiptData.currency}${person.totalOwed.toFixed(2)}\n`;
      text += `Items (${receiptData.currency}${person.subtotal.toFixed(2)}) + Tax/Tip (${receiptData.currency}${(person.taxShare + person.tipShare).toFixed(2)})\n`;
      text += `\n`;
    });

    text += `Generated by SplitSmart AI`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
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

  const chartData = summary.map((p) => ({ name: p.name, value: p.totalOwed }));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 h-full flex flex-col animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Settlement Summary</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCopied
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {isCopied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
            {isCopied ? "Copied" : "Copy"}
          </button>
          {onSaveHistory && (
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isSaved
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              }`}
            >
              {isSaved ? <Check size={14} /> : <Save size={14} />}
              {isSaved ? "Saved" : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
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
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Unassigned"
                        ? "#cbd5e1"
                        : COLORS[index % COLORS.length]
                    }
                    className="outline-none"
                  />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-2 rounded-xl text-[10px] font-bold shadow-xl border border-slate-700">
                        {payload[0].name}: {receiptData.currency}
                        {Number(payload[0].value).toFixed(2)}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Top Contributor
          </div>
          <div className="text-lg font-black text-slate-900 flex items-center gap-2">
            {summary[0]?.name}{" "}
            <ArrowUpRight size={20} className="text-indigo-500" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
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
                ? "bg-slate-50 border-slate-200 border-dashed opacity-80"
                : "bg-white border-slate-100 shadow-sm"
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
                  className={`font-bold tracking-tight ${person.name === "Unassigned" ? "text-slate-400 italic" : "text-slate-800"}`}
                >
                  {person.name}
                </span>
              </div>
              <span className="font-black text-indigo-600">
                {receiptData.currency}
                {person.totalOwed.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 px-3 py-2 rounded-xl">
                <div className="text-[8px] font-bold text-slate-400 uppercase">
                  Items
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {receiptData.currency}
                  {person.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-indigo-50/30 px-3 py-2 rounded-xl">
                <div className="text-[8px] font-bold text-slate-400 uppercase">
                  Tax & Tip
                </div>
                <div className="text-xs font-bold text-indigo-600">
                  {receiptData.currency}
                  {(person.taxShare + person.tipShare).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryDisplay;
