import React, { useMemo } from 'react';
import { ReceiptData, AssignmentMap, PersonSummary, DistributionMethod } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface SummaryDisplayProps {
  receiptData: ReceiptData | null;
  assignments: AssignmentMap;
  distributionMethod: DistributionMethod;
}

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'];

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ receiptData, assignments, distributionMethod }) => {
  const summary = useMemo<PersonSummary[]>(() => {
    if (!receiptData) return [];

    const peopleMap: Record<string, PersonSummary> = {};

    // Helper to init person
    const initPerson = (name: string) => {
      if (!peopleMap[name]) {
        peopleMap[name] = {
          name,
          items: [],
          subtotal: 0,
          taxShare: 0,
          tipShare: 0,
          totalOwed: 0,
        };
      }
    };

    // 1. Calculate item shares (Subtotal)
    receiptData.items.forEach((item) => {
      const assignedPeople = assignments[item.id] || [];
      const splitCount = assignedPeople.length;

      if (splitCount > 0) {
        const costPerPerson = item.price / splitCount;
        assignedPeople.forEach((person) => {
          initPerson(person);
          peopleMap[person].items.push({
            description: item.description + (splitCount > 1 ? ` (1/${splitCount})` : ''),
            amount: costPerPerson,
          });
          peopleMap[person].subtotal += costPerPerson;
        });
      }
    });

    // 2. Handle Unassigned
    const assignedItemIds = new Set(Object.keys(assignments).filter(k => assignments[k].length > 0));
    const unassignedItems = receiptData.items.filter(item => !assignedItemIds.has(item.id));
    
    if (unassignedItems.length > 0) {
        initPerson('Unassigned');
        unassignedItems.forEach(item => {
            peopleMap['Unassigned'].items.push({ description: item.description, amount: item.price });
            peopleMap['Unassigned'].subtotal += item.price;
        });
    }

    // 3. Distribute Tax and Tip
    const peopleList = Object.values(peopleMap);
    const validSubtotal = receiptData.subtotal || 1; 

    // Filter real people (excluding 'Unassigned') for Equal split logic
    const realPeopleCount = peopleList.filter(p => p.name !== 'Unassigned').length;

    peopleList.forEach((person) => {
      if (distributionMethod === 'PROPORTIONAL') {
        // (Person Subtotal / Total Subtotal) * Total Tax
        const shareRatio = person.subtotal / validSubtotal;
        person.taxShare = receiptData.tax * shareRatio;
        person.tipShare = receiptData.tip * shareRatio;
      } else if (distributionMethod === 'EQUAL') {
        // Equal split among real people
        if (person.name === 'Unassigned') {
           person.taxShare = 0;
           person.tipShare = 0;
        } else {
           // If no real people yet, prevent divide by zero (though unlikely if items are assigned)
           const count = realPeopleCount > 0 ? realPeopleCount : 1; 
           person.taxShare = receiptData.tax / count;
           person.tipShare = receiptData.tip / count;
        }
      }

      person.totalOwed = person.subtotal + person.taxShare + person.tipShare;
    });

    return peopleList.sort((a, b) => b.totalOwed - a.totalOwed);
  }, [receiptData, assignments, distributionMethod]);

  if (!receiptData) return null;

  const chartData = summary.map(p => ({ name: p.name, value: p.totalOwed }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Cost Breakdown</h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
           {distributionMethod === 'PROPORTIONAL' ? 'Proportional' : 'Equal Split'}
        </span>
      </div>
      
      {/* Chart */}
      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Unassigned' ? '#e5e7eb' : COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value: number) => `${receiptData.currency}${value.toFixed(2)}`} />
            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {summary.map((person, idx) => (
          <div key={person.name} className={`p-3 rounded-lg border ${person.name === 'Unassigned' ? 'bg-gray-50 border-gray-200 border-dashed' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold ${person.name === 'Unassigned' ? 'text-gray-500 italic' : 'text-gray-800'}`}>
                {person.name}
              </span>
              <span className="font-bold text-indigo-600">
                {receiptData.currency}{person.totalOwed.toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Items Subtotal</span>
                <span>{receiptData.currency}{person.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Tax & Tip ({distributionMethod === 'PROPORTIONAL' ? '%' : '='})</span>
                <span>{receiptData.currency}{(person.taxShare + person.tipShare).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryDisplay;
