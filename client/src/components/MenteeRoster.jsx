import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Check, AlertCircle, AlertTriangle, Mail, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MenteeRoster({ students = [], taName = 'Your' }) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, CRITICAL, RISK, TRACK
  const [sortField, setSortField] = useState('pspPct');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Reset page when search or risk filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter]);

  // Filter students
  let filtered = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (riskFilter === 'CRITICAL') return s.pspPct < 20;
    if (riskFilter === 'RISK') return s.pspPct >= 20 && s.pspPct < 50;
    if (riskFilter === 'TRACK') return s.pspPct >= 50;
    return true;
  });

  // Sort students
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
      setSortAsc(field === 'name' || field === 'email');
    }
  };

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const criticalCount = students.filter(s => s.pspPct < 20).length;
  const riskCount = students.filter(s => s.pspPct >= 20 && s.pspPct < 50).length;
  const trackCount = students.filter(s => s.pspPct >= 50).length;

  // Bulk email handler for critical students
  const handleBulkEmailAtRisk = () => {
    const atRiskEmails = students.filter(s => s.pspPct < 20).map(s => s.email);
    if (atRiskEmails.length === 0) return;
    const bccList = atRiskEmails.join(',');
    const subjectText = encodeURIComponent('Urgent: Scaler PSP Problem Solving Progress Check-in');
    const bodyText = encodeURIComponent(
      `Hi Mentee,\n\nI noticed your PSP (Problem Solving Percentage) is currently below the recommended target threshold of 20% on the Scaler portal.\n\nPlease complete your pending class assignment problems at the earliest so we can get your PSP back on track.\n\nLet me know if you are facing any blockers or need help with any concepts!\n\nBest regards,\n${taName} (Scaler TA)`
    );
    window.open(`mailto:?bcc=${bccList}&subject=${subjectText}&body=${bodyText}`);
  };

  return (
    <div className="table-container">
      <div className="table-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="table-title">{taName}'s Assigned Mentee Roster</div>
            <span className="badge badge-purple">{students.length} Total Mentees</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} mentees in your squad
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Bulk Email At-Risk Button */}
          {criticalCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleBulkEmailAtRisk}
              style={{
                backgroundColor: 'var(--status-red-bg)',
                color: '#fda4af',
                borderColor: 'var(--status-red-border)'
              }}
              title="Email all at-risk mentees (<20% PSP) at once"
            >
              <Mail size={14} />
              <span>Email {criticalCount} At-Risk Mentees</span>
            </button>
          )}

          {/* Risk Filter Tabs */}
          <div className="view-tabs">
            <button
              className={`view-tab ${riskFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setRiskFilter('ALL')}
            >
              All ({students.length})
            </button>
            <button
              className={`view-tab ${riskFilter === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setRiskFilter('CRITICAL')}
              style={{ color: riskFilter === 'CRITICAL' ? 'white' : 'var(--status-red)' }}
            >
              🚨 &lt;20% ({criticalCount})
            </button>
            <button
              className={`view-tab ${riskFilter === 'RISK' ? 'active' : ''}`}
              onClick={() => setRiskFilter('RISK')}
              style={{ color: riskFilter === 'RISK' ? 'white' : 'var(--status-yellow)' }}
            >
              ⚠️ 20-50% ({riskCount})
            </button>
            <button
              className={`view-tab ${riskFilter === 'TRACK' ? 'active' : ''}`}
              onClick={() => setRiskFilter('TRACK')}
              style={{ color: riskFilter === 'TRACK' ? 'white' : 'var(--status-green)' }}
            >
              ✅ 50%+ ({trackCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search mentee name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                Mentee Name <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
              </th>
              <th onClick={() => handleSort('email')}>Email</th>
              <th onClick={() => handleSort('assigned')}>Assigned</th>
              <th onClick={() => handleSort('solved')}>Solved</th>
              <th onClick={() => handleSort('pspPct')}>
                PSP % <ArrowUpDown size={12} style={{ display: 'inline', marginLeft: 4 }} />
              </th>
              <th>Progress</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageStudents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No mentees found matching your search criteria.
                </td>
              </tr>
            ) : (
              pageStudents.map(s => {
                let badgeClass = 'badge-green';
                let badgeText = 'On Track';
                let IconComp = Check;
                let barColor = 'var(--status-green)';

                if (s.pspPct < 20) {
                  badgeClass = 'badge-red';
                  badgeText = s.solved === 0 ? '0 Solved (Critical)' : 'Below 20%';
                  IconComp = AlertCircle;
                  barColor = 'var(--status-red)';
                } else if (s.pspPct < 50) {
                  badgeClass = 'badge-yellow';
                  badgeText = 'Needs Push';
                  IconComp = AlertTriangle;
                  barColor = 'var(--status-yellow)';
                }

                const emailBody = encodeURIComponent(
                  `Hi ${s.name},\n\nHope you are doing well!\n\nI am reaching out regarding your current PSP score (${s.pspPct}% - ${s.solved}/${s.assigned} problems solved).\n\nPlease make sure to complete your pending class assignments at the earliest.\n\nBest regards,\n${taName}`
                );

                return (
                  <tr key={s.email}>
                    <td style={{ fontWeight: 700 }}>
                      {s.name}
                      {s.solved === 0 && (
                        <span
                          title="Has not solved any assignment problem yet!"
                          style={{
                            marginLeft: '0.4rem',
                            display: 'inline-block',
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--status-red)'
                          }}
                        />
                      )}
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                      {s.email}
                    </td>
                    <td className="font-mono">{s.assigned}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      {s.solved}
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: barColor }}>
                      {s.pspPct}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(s.pspPct, 100)}%`,
                              backgroundColor: barColor
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        <IconComp size={12} />
                        {badgeText}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        href={`mailto:${s.email}?subject=${encodeURIComponent('PSP Progress Check-in')}&body=${emailBody}`}
                        className="btn btn-secondary btn-icon"
                        title={`Send email to ${s.name}`}
                        style={{ padding: '0.35rem 0.6rem' }}
                      >
                        <Mail size={14} />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              className="btn btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
