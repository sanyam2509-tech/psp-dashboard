import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine, Legend } from 'recharts';

export default function AnalyticsCharts({
  students = [],
  taData = [],
  currentTaId = null,
  currentTaName = 'Your Squad',
  batchStudents = []
}) {
  const [activeTab, setActiveTab] = useState('DISTRIBUTION'); // 'DISTRIBUTION' | 'SQUAD_VS_BATCH'

  // 1. Bucket squad students into PSP distribution ranges
  const squadBuckets = useMemo(() => {
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
    return buckets;
  }, [students]);

  // 2. Bucket batch students for comparative analysis
  const comparisonData = useMemo(() => {
    const batchCounts = [0, 0, 0, 0, 0];
    const allBatch = batchStudents.length > 0 ? batchStudents : students;
    for (const s of allBatch) {
      if (s.solved === 0 || s.pspPct === 0) batchCounts[0]++;
      else if (s.pspPct < 20) batchCounts[1]++;
      else if (s.pspPct < 50) batchCounts[2]++;
      else if (s.pspPct < 80) batchCounts[3]++;
      else batchCounts[4]++;
    }

    const totalSquad = students.length || 1;
    const totalBatch = allBatch.length || 1;

    return [
      {
        tier: '0% Solved',
        'Your Squad %': parseFloat(((squadBuckets[0].count / totalSquad) * 100).toFixed(1)),
        'Batch Avg %': parseFloat(((batchCounts[0] / totalBatch) * 100).toFixed(1))
      },
      {
        tier: '1-19% PSP',
        'Your Squad %': parseFloat(((squadBuckets[1].count / totalSquad) * 100).toFixed(1)),
        'Batch Avg %': parseFloat(((batchCounts[1] / totalBatch) * 100).toFixed(1))
      },
      {
        tier: '20-49% PSP',
        'Your Squad %': parseFloat(((squadBuckets[2].count / totalSquad) * 100).toFixed(1)),
        'Batch Avg %': parseFloat(((batchCounts[2] / totalBatch) * 100).toFixed(1))
      },
      {
        tier: '50-79% PSP',
        'Your Squad %': parseFloat(((squadBuckets[3].count / totalSquad) * 100).toFixed(1)),
        'Batch Avg %': parseFloat(((batchCounts[3] / totalBatch) * 100).toFixed(1))
      },
      {
        tier: '80-100% PSP',
        'Your Squad %': parseFloat(((squadBuckets[4].count / totalSquad) * 100).toFixed(1)),
        'Batch Avg %': parseFloat(((batchCounts[4] / totalBatch) * 100).toFixed(1))
      }
    ];
  }, [students, batchStudents, squadBuckets]);

  // 3. Prepare TAs comparison chart with Active TA pinned/highlighted
  const taChartData = useMemo(() => {
    let displayTaList = [...taData];
    const cleanCurrentTaId = currentTaId ? currentTaId.replace(/\s+/g, '').toLowerCase() : '';
    const currentTaIdx = displayTaList.findIndex(t => 
      (t.taId && t.taId.replace(/\s+/g, '').toLowerCase() === cleanCurrentTaId) ||
      (t.taName && currentTaName && t.taName.toLowerCase() === currentTaName.toLowerCase())
    );

    let chartTAs = [];
    if (currentTaIdx !== -1 && currentTaIdx >= 10) {
      chartTAs = [...displayTaList.slice(0, 9), displayTaList[currentTaIdx]];
    } else {
      chartTAs = displayTaList.slice(0, 10);
    }

    return chartTAs.map(t => {
      const isCurrent = (t.taId && t.taId.replace(/\s+/g, '').toLowerCase() === cleanCurrentTaId) ||
                        (t.taName && currentTaName && t.taName.toLowerCase() === currentTaName.toLowerCase());
      
      return {
        name: isCurrent ? `${t.taName.split(' ')[0]} (You)` : t.taName.split(' ')[0],
        fullName: isCurrent ? `${t.taName} (Your Squad)` : t.taName,
        kpi1: t.kpi1Pct,
        kpi2: t.kpi2Pct,
        isMet: t.kpi2Met,
        isCurrent
      };
    });
  }, [taData, currentTaId, currentTaName]);

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
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            {data.fullName || label}
            {data.isCurrent && <span style={{ color: '#38bdf8', marginLeft: '0.4rem', fontWeight: 800 }}>(You)</span>}
          </div>
          {payload.map((entry, idx) => (
            <div key={idx} style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {entry.name}: <strong style={{ color: entry.color || '#3b82f6' }}>{entry.value}{entry.unit || '%'}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Student PSP Distribution & Squad vs Batch Comparison */}
      <div className="table-container" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {activeTab === 'DISTRIBUTION' ? 'Mentee PSP Distribution' : 'Squad vs Batch PSP Progress'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {activeTab === 'DISTRIBUTION'
                ? 'Breakdown of your squad students by performance tier'
                : 'Compare your squad PSP % distribution against whole batch'}
            </p>
          </div>
          <div className="view-tabs" style={{ fontSize: '0.7rem' }}>
            <button
              className={`view-tab ${activeTab === 'DISTRIBUTION' ? 'active' : ''}`}
              onClick={() => setActiveTab('DISTRIBUTION')}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              Squad Tiers
            </button>
            <button
              className={`view-tab ${activeTab === 'SQUAD_VS_BATCH' ? 'active' : ''}`}
              onClick={() => setActiveTab('SQUAD_VS_BATCH')}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
            >
              Squad vs Batch
            </button>
          </div>
        </div>

        <div style={{ height: '260px', width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={260} debounce={50}>
            {activeTab === 'DISTRIBUTION' ? (
              <BarChart data={squadBuckets} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#1e293b' }} height={45} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]}>
                  {squadBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={comparisonData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={{ stroke: '#1e293b' }} height={45} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '5px' }} />
                <Bar dataKey="Your Squad %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Batch Avg %" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top TAs KPI Comparison Chart (Pinned & Highlighted Active TA) */}
      <div className="table-container" style={{ padding: '1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              TA Benchmark — Avg PSP % (KPI 2)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Top performers &amp; your squad position (Target &ge; 40%)
            </p>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>Highlighted: You</span>
        </div>

        <div style={{ height: '260px', width: '100%', minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={260} debounce={50}>
            <BarChart data={taChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
                height={45}
              />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target 40%', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              <Bar dataKey="kpi2" name="Avg PSP %" radius={[8, 8, 0, 0]}>
                {taChartData.map((entry, index) => {
                  let fill = entry.isMet ? '#10b981' : '#f43f5e';
                  if (entry.isCurrent) {
                    fill = '#38bdf8'; // Highlight Active TA in vibrant cyan!
                  }
                  return <Cell key={`ta-cell-${index}`} fill={fill} stroke={entry.isCurrent ? '#ffffff' : undefined} strokeWidth={entry.isCurrent ? 2 : 0} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
