import React, { useState, useEffect } from "react";
import {
  ReceiptData,
  AssignmentMap,
  DistributionMethod,
  ItemOverridesMap,
  ReceiptItem,
  ItemManualSplitsMap,
} from "../types";
import {
  User,
  Receipt as ReceiptIcon,
  Settings2,
  Edit3,
  Check,
  X,
  Plus,
  Minus,
  Users,
  AlertCircle,
  Calculator,
} from "lucide-react";

interface ReceiptDisplayProps {
  data: ReceiptData | null;
  assignments: AssignmentMap;
  itemManualSplits: ItemManualSplitsMap;
  isLoading: boolean;
  distributionMethod: DistributionMethod;
  onDistributionChange: (method: DistributionMethod) => void;
  itemOverrides: ItemOverridesMap;
  onOverrideChange: (overrides: ItemOverridesMap) => void;
  onUpdateItem: (item: ReceiptItem) => void;
  onUpdateAssignments: (itemId: string, names: string[]) => void;
  onUpdateManualSplits: (
    itemId: string,
    splits: { [name: string]: number } | null,
  ) => void;
  allParticipants: string[];
}

interface ValidationErrors {
  description?: string;
  price?: string;
  quantity?: string;
}

interface EditFields {
  description: string;
  price: string;
  quantity: string;
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({
  data,
  assignments,
  itemManualSplits,
  isLoading,
  distributionMethod,
  onDistributionChange,
  itemOverrides,
  onOverrideChange,
  onUpdateItem,
  onUpdateAssignments,
  onUpdateManualSplits,
  allParticipants,
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [splittingItemId, setSplittingItemId] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [customSplitDraft, setCustomSplitDraft] = useState<{
    [name: string]: string;
  }>({});

  const validate = (desc: string, pr: string, qty: string) => {
    const newErrors: ValidationErrors = {};
    if (!desc.trim()) newErrors.description = "Description is required";

    const p = parseFloat(pr);
    if (pr.trim() === "" || isNaN(p) || p < 0) {
      newErrors.price = "Invalid price";
    }

    const q = parseInt(qty);
    if (qty.trim() === "" || isNaN(q)) {
      newErrors.quantity = "Invalid";
    } else if (q < 1) {
      newErrors.quantity = "Min 1";
    } else if (q > 999) {
      newErrors.quantity = "Max 999";
    }

    return newErrors;
  };

  const startEditing = (item: ReceiptItem) => {
    setEditingItemId(item.id);
    setEditFields({
      description: item.description,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
    });
    setErrors({});
    setSplittingItemId(null);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditFields(null);
    setErrors({});
  };

  const saveEditing = (id: string) => {
    if (!editFields) return;
    const currentErrors = validate(
      editFields.description,
      editFields.price,
      editFields.quantity,
    );
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    const price = parseFloat(editFields.price);
    const quantity = parseInt(editFields.quantity);
    onUpdateItem({ id, description: editFields.description, price, quantity });
    cancelEditing();
  };

  const handleEditChange = (field: keyof EditFields, value: string) => {
    if (!editFields) return;
    const updated: EditFields = { ...editFields, [field]: value };
    setEditFields(updated);
    setErrors(validate(updated.description, updated.price, updated.quantity));
  };

  const adjustQuantity = (delta: number) => {
    if (!editFields) return;
    const current = parseInt(editFields.quantity) || 1;
    const next = Math.max(1, current + delta);
    handleEditChange("quantity", next.toString());
  };

  const toggleSplitting = (itemId: string) => {
    if (splittingItemId === itemId) {
      setSplittingItemId(null);
    } else {
      setSplittingItemId(itemId);
      setEditingItemId(null);
      const existing = itemManualSplits[itemId] || {};
      const draft: { [name: string]: string } = {};
      Object.keys(existing).forEach((name) => {
        draft[name] = existing[name].toString();
      });
      setCustomSplitDraft(draft);
    }
  };

  const togglePersonOnItem = (itemId: string, name: string) => {
    const current = assignments[itemId] || [];
    const isCustom = !!itemManualSplits[itemId];

    if (current.includes(name)) {
      onUpdateAssignments(
        itemId,
        current.filter((n) => n !== name),
      );
      if (isCustom) {
        const nextDraft = { ...customSplitDraft };
        delete nextDraft[name];
        setCustomSplitDraft(nextDraft);
        saveManualSplits(itemId, nextDraft);
      }
    } else {
      onUpdateAssignments(itemId, [...current, name]);
      if (isCustom) {
        const nextDraft = { ...customSplitDraft, [name]: "0" };
        setCustomSplitDraft(nextDraft);
        saveManualSplits(itemId, nextDraft);
      }
    }
  };

  const handleAddNewPerson = (itemId: string) => {
    if (newPersonName.trim()) {
      const name = newPersonName.trim();
      const current = assignments[itemId] || [];
      if (!current.includes(name)) {
        onUpdateAssignments(itemId, [...current, name]);
        const isCustom = !!itemManualSplits[itemId];
        if (isCustom) {
          const nextDraft = { ...customSplitDraft, [name]: "0" };
          setCustomSplitDraft(nextDraft);
          saveManualSplits(itemId, nextDraft);
        }
      }
      setNewPersonName("");
      setNameError(false);
    } else {
      setNameError(true);
    }
  };

  const handleOverrideChange = (
    itemId: string,
    field: "tax" | "tip",
    value: string,
  ) => {
    const numValue = value === "" ? NaN : parseFloat(value);
    const newOverrides = { ...itemOverrides };
    if (!newOverrides[itemId]) newOverrides[itemId] = {};
    if (isNaN(numValue)) {
      delete newOverrides[itemId][field];
      if (Object.keys(newOverrides[itemId]).length === 0)
        delete newOverrides[itemId];
    } else {
      newOverrides[itemId][field] = numValue;
    }
    onOverrideChange(newOverrides);
  };

  const handleCustomSplitChange = (
    name: string,
    value: string,
    itemId: string,
  ) => {
    const nextDraft = { ...customSplitDraft, [name]: value };
    setCustomSplitDraft(nextDraft);
    saveManualSplits(itemId, nextDraft);
  };

  const saveManualSplits = (
    itemId: string,
    draft: { [name: string]: string },
  ) => {
    const final: { [name: string]: number } = {};
    Object.keys(draft).forEach((name) => {
      const val = parseFloat(draft[name]);
      final[name] = isNaN(val) ? 0 : val;
    });
    onUpdateManualSplits(itemId, final);
  };

  const toggleManualMode = (itemId: string, itemPrice: number) => {
    const currentlyCustom = !!itemManualSplits[itemId];
    if (currentlyCustom) {
      onUpdateManualSplits(itemId, null);
      setCustomSplitDraft({});
    } else {
      const assigned = assignments[itemId] || [];
      const equalShare =
        assigned.length > 0 ? (itemPrice / assigned.length).toFixed(2) : "0";
      const draft: { [name: string]: string } = {};
      assigned.forEach((name) => (draft[name] = equalShare));
      setCustomSplitDraft(draft);
      saveManualSplits(itemId, draft);
    }
  };

  if (isLoading || !data) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Receipt Details
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Verified AI Scan
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Bill
            </div>
            <div className="text-2xl font-black text-slate-900">
              {data.currency}
              {data.total.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.items.map((item) => {
            const assignedTo = assignments[item.id] || [];
            const manualSplits = itemManualSplits[item.id];
            const override = itemOverrides[item.id];
            const isEditing = editingItemId === item.id;
            const isSplitting = splittingItemId === item.id;
            const hasErrors = isEditing && Object.keys(errors).length > 0;
            const currentTotalSplit: number = Object.values(manualSplits || {}).reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const isSplitBalanced =
              !manualSplits || Math.abs(currentTotalSplit - item.price) < 0.01;

            return (
              <div
                key={item.id}
                className={`relative bg-slate-50/50 p-4 rounded-2xl border transition-all duration-300 ${
                  isEditing || isSplitting
                    ? "border-indigo-400 bg-white shadow-lg ring-4 ring-indigo-50 z-10 scale-[1.02]"
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                } ${hasErrors ? "border-rose-400 ring-rose-50" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    {isEditing && editFields ? (
                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                            Description
                          </label>
                          <input
                            className={`w-full text-sm font-bold text-slate-900 bg-white border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-300"}`}
                            value={editFields.description}
                            autoFocus
                            placeholder="Item name"
                            onChange={(e) =>
                              handleEditChange("description", e.target.value)
                            }
                          />
                          {errors.description && (
                            <span className="absolute -bottom-4 left-1 text-[9px] font-bold text-rose-500 flex items-center gap-1">
                              <AlertCircle size={8} /> {errors.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-end gap-4">
                          <div className="relative flex-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                              Quantity
                            </label>
                            <div className="flex items-center">
                              <button
                                onClick={() => adjustQuantity(-1)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-l-xl border-y border-l border-slate-300 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                type="number"
                                className={`w-full text-center text-xs font-bold py-2 outline-none border transition-all ${errors.quantity ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-300 text-slate-900"}`}
                                value={editFields.quantity}
                                onChange={(e) =>
                                  handleEditChange("quantity", e.target.value)
                                }
                              />
                              <button
                                onClick={() => adjustQuantity(1)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-r-xl border-y border-r border-slate-300 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            {errors.quantity && (
                              <span className="absolute -bottom-4 left-0 text-[9px] font-bold text-rose-500">
                                {errors.quantity}
                              </span>
                            )}
                          </div>

                          <div className="relative flex-[2]">
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block text-right">
                              Line Total
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                {data.currency}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                className={`w-full pl-6 pr-3 py-2 text-right text-sm font-mono font-bold text-slate-900 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 ${errors.price ? "border-rose-300 bg-rose-50" : "border-slate-300"}`}
                                value={editFields.price}
                                onChange={(e) =>
                                  handleEditChange("price", e.target.value)
                                }
                              />
                            </div>
                            {errors.price && (
                              <span className="absolute -bottom-4 right-0 text-[9px] font-bold text-rose-500">
                                {errors.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">
                          {item.description}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="text-right">
                      <div className="text-slate-900 font-mono font-bold bg-white px-2 py-1 rounded-lg border border-slate-100">
                        {data.currency}
                        {item.price.toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-[9px] text-slate-400 font-medium mt-1">
                          {data.currency}
                          {(item.price / item.quantity).toFixed(2)} ea
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100/50">
                  <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
                    {assignedTo.length > 0 ? (
                      assignedTo.map((person) => (
                        <div
                          key={person}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-bold border transition-all ${
                            manualSplits
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}
                        >
                          <User size={10} />
                          {person}
                          {manualSplits && (
                            <span className="ml-1 opacity-60">
                              ({data.currency}
                              {manualSplits[person]?.toFixed(2)})
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                        <Users size={12} /> Needs Assignment
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEditing(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${hasErrors ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"}`}
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleSplitting(item.id)}
                          className={`p-2 rounded-xl transition-all ${isSplitting ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm"}`}
                          title="Split between people"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2 bg-white text-slate-400 hover:text-amber-600 border border-slate-100 shadow-sm rounded-xl transition-all"
                          title="Edit item details"
                        >
                          <Edit3 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isSplitting && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Assign Participants
                      </div>
                      <button
                        onClick={() => toggleManualMode(item.id, item.price)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          manualSplits
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        <Calculator size={10} />
                        {manualSplits
                          ? "Custom Split: ON"
                          : "Custom Split: OFF"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {allParticipants.map((name) => (
                        <button
                          key={name}
                          onClick={() => togglePersonOnItem(item.id, name)}
                          className={`text-xs px-3 py-2 rounded-xl font-bold transition-all border flex items-center gap-1.5 ${
                            assignedTo.includes(name)
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400"
                          }`}
                        >
                          {assignedTo.includes(name) ? (
                            <Check size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          {name}
                        </button>
                      ))}
                    </div>

                    {manualSplits ? (
                      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-inner mb-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2 text-amber-700">
                          <Calculator size={14} />
                          <span className="text-[10px] font-bold uppercase">
                            Manual Amount Entry
                          </span>
                        </div>
                        {assignedTo.map((name) => (
                          <div
                            key={name}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="text-xs font-bold text-slate-600 truncate">
                              {name}
                            </span>
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                {data.currency}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                                value={customSplitDraft[name] || ""}
                                onChange={(e) =>
                                  handleCustomSplitChange(
                                    name,
                                    e.target.value,
                                    item.id,
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-2">
                          <div className="text-[10px] font-bold text-slate-400">
                            Total Split
                          </div>
                          <div
                            className={`text-xs font-black font-mono ${!isSplitBalanced ? "text-rose-500" : "text-emerald-600"}`}
                          >
                            {data.currency}
                            {currentTotalSplit.toFixed(2)}
                            <span className="text-slate-400 font-normal ml-1">
                              / {item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {!isSplitBalanced && (
                          <div className="text-[9px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg flex items-center gap-2">
                            <AlertCircle size={10} />
                            Remaining: {data.currency}
                            {(item.price - currentTotalSplit).toFixed(2)}
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Quick add person..."
                          className={`flex-1 text-xs bg-white border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${nameError ? "border-rose-400 ring-rose-50" : "border-slate-200"}`}
                          value={newPersonName}
                          onChange={(e) => {
                            setNewPersonName(e.target.value);
                            if (e.target.value.trim()) setNameError(false);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddNewPerson(item.id)
                          }
                        />
                        <button
                          onClick={() => handleAddNewPerson(item.id)}
                          className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {nameError && (
                        <div className="flex items-center gap-1 mt-1 text-rose-500 animate-in fade-in slide-in-from-left-2">
                          <AlertCircle size={10} />
                          <span className="text-[10px] font-bold">
                            Please enter a name
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSplittingItemId(null)}
                      className="w-full mt-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} /> Confirm Assignments
                    </button>
                  </div>
                )}

                {distributionMethod === "MANUAL" && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-3 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-wider">
                        Specific Tax
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {data.currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Auto-calc"
                          className={`w-full pl-6 pr-3 py-1.5 bg-white border rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${override?.tax !== undefined && override.tax < 0 ? "border-rose-400" : "border-slate-200"}`}
                          value={override?.tax != null ? override.tax.toString() : ""}
                          onChange={(e) =>
                            handleOverrideChange(item.id, "tax", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-wider">
                        Specific Tip
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {data.currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Auto-calc"
                          className={`w-full pl-6 pr-3 py-1.5 bg-white border rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${override?.tip !== undefined && override.tip < 0 ? "border-rose-400" : "border-slate-200"}`}
                          value={override?.tip != null ? override.tip.toString() : ""}
                          onChange={(e) =>
                            handleOverrideChange(item.id, "tip", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 mb-6 text-sm">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>
                {data.currency}
                {data.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Tax</span>
              <span>
                {data.currency}
                {data.tax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Tip</span>
              <span>
                {data.currency}
                {data.tip.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-100 col-span-2">
              <span>Grand Total</span>
              <span>
                {data.currency}
                {data.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              <Settings2 size={12} /> Distribution Strategy
            </div>
            <div className="flex p-1 bg-slate-200 rounded-xl">
              {(
                ["PROPORTIONAL", "EQUAL", "MANUAL"] as DistributionMethod[]
              ).map((method) => (
                <button
                  key={method}
                  onClick={() => onDistributionChange(method)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    distributionMethod === method
                      ? "bg-white text-indigo-600 shadow-md scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {method.charAt(0) +
                    method
                      .slice(1)
                      .toLowerCase()
                      .replace("proportional", "Prop.")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDisplay;
