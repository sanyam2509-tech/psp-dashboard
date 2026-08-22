import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AtRiskBanner({ summary, students = [] }) {
  const atRiskStudents = students.filter(s => s.isBelow20);
  const zeroSolvers = students.filter(s => s.solved === 0);

  if (atRiskStudents.length === 0) {
    return (
      <div className="alert-banner alert-banner-success">
        <div className="alert-icon" style={{ color: 'var(--status-green)' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="alert-title" style={{ color: 'var(--status-green)' }}>
            🎉 Excellent Work! All Mentees Are On Track
          </div>
          <div className="alert-body">
            100% of your assigned mentees are above the 20% PSP threshold. No students are currently at risk in your squad.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alert-banner alert-banner-danger">
      <ShieldAlert className="alert-icon" size={24} style={{ color: 'var(--status-red)' }} />
      <div style={{ width: '100%' }}>
        <div className="alert-title" style={{ color: '#fda4af' }}>
          🚨 Attention Required: {summary?.below20Count || atRiskStudents.length} Mentees Below 20% PSP
          {zeroSolvers.length > 0 && ` (${zeroSolvers.length} Zero-Solvers)`}
        </div>
        <div className="alert-body">
          KPI 1 Target: Keep mentees &lt; 20% PSP below 35% of squad. Reach out to these mentees to resolve assignment blockers.
        </div>

        <div className="at-risk-pills">
          {atRiskStudents.map(s => (
            <a
              key={s.email}
              href={`mailto:${s.email}?subject=${encodeURIComponent('PSP Progress Check-in')}`}
              className="risk-pill"
              title={`Click to email ${s.name}`}
              style={{ textDecoration: 'none' }}
            >
              <AlertCircle size={13} />
              <span>{s.name}</span>
              <span className="font-mono" style={{ fontWeight: 800 }}>({s.pspPct}%)</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
