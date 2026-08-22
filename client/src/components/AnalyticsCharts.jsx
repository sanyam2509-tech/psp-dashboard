import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from 'recharts';

export default function AnalyticsCharts({ students = [], taData = [] }) {
  // 1. Bucket students into PSP distribution ranges
  const buckets = [
    { name: '0% Solved', count: 0, color: '#f43f5e' },
    { name: '1-19% PSP', count: 0, color: '#fb7185' },
    { name: '20-49% PSP', count: 0, color: '#f59e0b' },
    { name: '50-79% PSP', count: 0, color: '#3b82f6' },
    { name: '80-100% PSP', count: 0, color: '#10b981' }
  ];

  for (const s of students) {
    if (s.solved === 0 || s.pspPct === 0) buckets[0].count++;
    else if (s.pspPct < 20) buckets[1].count++;
    else if (s.pspPct < 50) buckets[2].count++;
    else if (s.pspPct < 80) buckets[3].count++;
    else buckets[4].count++;
  }

  // 2. Prepare top TAs comparison chart
  const taChartData = taData.slice(0, 10).map(t => ({
    name: t.taName.split(' ')[0],
    fullName: t.taName,
    kpi1: t.kpi1Pct,
    kpi2: t.kpi2Pct,
    isMet: t.kpi2Met
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          color: '#fff'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{data.fullName || label}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {payload[0].name}: <strong style={{ color: payload[0].color || '#3b82f6' }}>{payload[0].value}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Student PSP Bucket Chart */}
      <div className="table-container" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              Mentee PSP Distribution
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Breakdown of your assigned students by performance tier
            </p>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>Squad Distribution</span>
        </div>

        <div style={{ height: '230px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                {buckets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top TAs KPI Comparison Chart */}
      <div className="table-container" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              Top 10 TAs — Average PSP % (KPI 2)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Target threshold is ≥ 40% average PSP across squad
            </p>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Benchmark</span>
        </div>

        <div style={{ height: '230px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target 40%', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              <Bar dataKey="kpi2" name="Avg PSP %" radius={[8, 8, 0, 0]}>
                {taChartData.map((entry, index) => (
                  <Cell key={`ta-cell-${index}`} fill={entry.isMet ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
