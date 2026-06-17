"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

const COLORS = ['#14b8a6', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#10B981'];

interface AnalyticsChartProps {
  data: any[];
  type?: "bar" | "line" | "pie" | "area" | "scatter" | "radar";
  xKey: string;
  yKey: string;
}

export function AnalyticsChart({ data, type = "bar", xKey, yKey }: AnalyticsChartProps) {
  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isUsd = yKey.toLowerCase().includes('usd') || yKey.toLowerCase().includes('revenue');
      const formattedVal = typeof val === 'number' 
        ? (isUsd ? '$' : '') + val.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})
        : val;
        
      const rawLabel = payload[0].payload[xKey] || label;
      const formattedLabel = typeof rawLabel === 'string' && rawLabel.includes('T00:00:00') ? rawLabel.split('T')[0] : rawLabel;
        
      return (
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-xs mb-1 font-medium">{formattedLabel}</p>
          <p className="text-gray-800 font-bold text-sm">
            {payload[0].name}: {formattedVal}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72 mt-4 p-4 bg-white rounded-xl border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        {type === "pie" ? (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : type === "radar" ? (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#f3f4f6" />
            <PolarAngleAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar name={yKey} dataKey={yKey} stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.4} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={yKey} stroke="#10B981" fillOpacity={1} fill="url(#colorY)" />
          </AreaChart>
        ) : type === "scatter" ? (
          <ScatterChart margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey={xKey} type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={yKey} type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
            <Tooltip cursor={{strokeDasharray: '3 3'}} content={<CustomTooltip />} />
            <Scatter name={yKey} data={data} fill="#EC4899" />
          </ScatterChart>
        ) : type === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar 
              dataKey={yKey} 
              fill="#14b8a6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey={xKey} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#8B5CF6" 
              strokeWidth={3}
              dot={{ fill: '#ffffff', stroke: '#8B5CF6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#fff' }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
