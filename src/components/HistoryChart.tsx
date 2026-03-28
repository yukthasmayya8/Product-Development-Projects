import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

interface HistoryChartProps {
  data: any[];
}

export default function HistoryChart({ data }: HistoryChartProps) {
  const chartData = data.map((d) => ({
    name: d.subject,
    duration: d.durationMinutes,
  }));

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#1a1a1a]/5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp size={20} className="text-[#5A5A40]" />
        <h3 className="text-xs uppercase tracking-[0.2em] opacity-50 font-sans font-bold">Study Progress</h3>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a10" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#1a1a1a60', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#1a1a1a60', fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: '#1a1a1a05' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif' }}
            />
            <Bar dataKey="duration" radius={[8, 8, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#5A5A40' : '#8E8E6D'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-8 border-t border-[#1a1a1a]/5 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest opacity-40 font-bold">Total Focus</span>
          <span className="text-2xl font-light tracking-tighter">
            {data.reduce((acc, curr) => acc + curr.durationMinutes, 0)} <span className="text-sm opacity-50">min</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-widest opacity-40 font-bold">Sessions</span>
          <span className="text-2xl font-light tracking-tighter">{data.length}</span>
        </div>
      </div>
    </div>
  );
}
