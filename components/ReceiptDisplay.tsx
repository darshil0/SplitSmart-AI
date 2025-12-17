import React from 'react';
import { ReceiptData, AssignmentMap } from '../types';
import { User, DollarSign, Receipt as ReceiptIcon } from 'lucide-react';

interface ReceiptDisplayProps {
  data: ReceiptData | null;
  assignments: AssignmentMap;
  isLoading: boolean;
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ data, assignments, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p>Analyzing receipt...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-8 text-center">
        <ReceiptIcon size={64} className="text-gray-200" />
        <p className="text-lg font-medium text-gray-500">No receipt uploaded yet</p>
        <p className="text-sm">Upload an image to start splitting the bill.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Receipt</h2>
          <p className="text-sm text-gray-500">{data.items.length} items found</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-indigo-600">
            {data.currency}{data.total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.items.map((item) => {
          const assignedTo = assignments[item.id] || [];
          
          return (
            <div key={item.id} className="group relative bg-gray-50 hover:bg-white p-4 rounded-xl border border-transparent hover:border-indigo-100 transition-all duration-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{item.description}</span>
                    {item.quantity > 1 && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-gray-700 font-mono font-medium">
                  {data.currency}{item.price.toFixed(2)}
                </div>
              </div>

              {/* Assignment Tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {assignedTo.length > 0 ? (
                  assignedTo.map((person, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      <User size={12} />
                      {person}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-400 text-xs italic px-1">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer totals */}
      <div className="mt-8 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{data.currency}{data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{data.currency}{data.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tip</span>
          <span>{data.currency}{data.tip.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
          <span>Total</span>
          <span>{data.currency}{data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDisplay;
