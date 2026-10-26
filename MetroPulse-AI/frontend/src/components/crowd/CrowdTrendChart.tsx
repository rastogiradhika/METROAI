import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CrowdTrendPoint } from '../../types/crowd';

interface CrowdTrendChartProps {
  data: CrowdTrendPoint[];
  title?: string;
  predictedData?: Array<{ time: string; predictedCount: number | null }>;
  height?: number;
}

export default function CrowdTrendChart({ data, title, predictedData, height = 200 }: CrowdTrendChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className="chart-empty" role="status" aria-label="Not enough data to display trend">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        <span>Insufficient data to display trend chart.</span>
      </div>
    );
  }

  const merged = data.map((pt, i) => ({
    time: pt.time,
    observed: pt.observedCount,
    predicted: predictedData?.[i]?.predictedCount ?? null,
  }));

  return (
    <div className="crowd-trend-chart">
      {title && <div className="chart-title">{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#0d1f3c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          <Line
            type="monotone"
            dataKey="observed"
            name="Observed Persons"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          {predictedData && (
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted Persons"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ fill: '#f59e0b', r: 3 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
