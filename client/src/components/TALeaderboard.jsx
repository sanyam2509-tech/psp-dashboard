import React, { useState } from 'react';
import { Search, ArrowUpDown, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export default function TALeaderboard({
  taData = [],
  currentTaId,
  onSelectTa,
  subject = 'WEBDEV'
}) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('taName');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter
  let filtered = taData.filter(ta =>
    ta.taName.toLowerCase().includes(search.toLowerCase()) ||
    ta.taId.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  filtered.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'taName');
    }
  };

  return (
    <div className="table-container">
      <div className="table-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="table-title">All TAs KPI Performance Overview</div>
            <span className="badge badge-purple">{subject}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Performance matrix across all {taData.length} TAs. Click any TA row to view their squad roster.
          </div>
        </div>

        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search TA name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('taName')}>
                TA Name <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
              </th>
              <th>TA ID</th>
              <th onClick={() => handleSort('numStudents')}>Mentees</th>
              <th onClick={() => handleSort('kpi1Pct')}>
                KPI 1 (&lt;20% PSP) <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Max 35%)</span>
              </th>
              <th onClick={() => handleSort('kpi2Pct')}>
                KPI 2 (Avg PSP) <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Min 40%)</span>
              </th>
              <th>KPI 1</th>
              <th>KPI 2</th>
              <th>Overall</th>
              <th style={{ textAlign: 'right' }}>Drilldown</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No TAs found matching "{search}".
                </td>
              </tr>
            ) : (
              filtered.map(ta => {
                const isSelected = ta.taId === currentTaId;
                const bothMet = ta.kpi1Met && ta.kpi2Met;
                const noneMet = !ta.kpi1Met && !ta.kpi2Met;

                return (
                  <tr
                    key={ta.taId}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : undefined
                    }}
                    onClick={() => onSelectTa(ta)}
                  >
                    <td style={{ fontWeight: 700 }}>
                      {ta.taName}
                      {isSelected && (
                        <span className="badge badge-blue" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                          Active Profile
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                      {ta.taId}
                    </td>
                    <td className="font-mono">{ta.numStudents}</td>
                    <td className="font-mono" style={{ color: ta.kpi1Met ? 'var(--status-green)' : 'var(--status-red)', fontWeight: 800 }}>
                      {ta.kpi1Pct}%
                    </td>
                    <td className="font-mono" style={{ color: ta.kpi2Met ? 'var(--status-green)' : 'var(--status-red)', fontWeight: 800 }}>
                      {ta.kpi2Pct}%
                    </td>
                    <td>
                      {ta.kpi1Met ? (
                        <span className="badge badge-green"><CheckCircle size={12} /> Met</span>
                      ) : (
                        <span className="badge badge-red"><XCircle size={12} /> Fail</span>
                      )}
                    </td>
                    <td>
                      {ta.kpi2Met ? (
                        <span className="badge badge-green"><CheckCircle size={12} /> Met</span>
                      ) : (
                        <span className="badge badge-red"><XCircle size={12} /> Fail</span>
                      )}
                    </td>
                    <td>
                      {bothMet ? (
                        <span className="badge badge-green">Passed ✅</span>
                      ) : noneMet ? (
                        <span className="badge badge-red">Failed ❌</span>
                      ) : (
                        <span className="badge badge-yellow">Partial ⚠️</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-icon" style={{ padding: '0.3rem 0.5rem' }}>
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
