import React from 'react';
import { RefreshCw, User, Calendar, BookOpen, Clock, Activity } from 'lucide-react';

export default function Header({
  subject,
  setSubject,
  asOfDate,
  setAsOfDate,
  availableSubjects = [],
  availableDates = [],
  currentTaName,
  onOpenTaModal,
  lastSyncedAt,
  onRefresh,
  isRefreshing
}) {

  const formatLastSynced = (iso) => {
    if (!iso) return 'Syncing...';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo">PSP</div>
        <div>
          <h1 className="brand-title">PSP Mentee Analytics</h1>
          <div className="brand-subtitle">Live Scaler TA Performance Dashboard</div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Subject Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BookOpen size={15} className="text-muted" />
          <select
            className="select-control"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {availableSubjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Date Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={15} className="text-muted" />
          <select
            className="select-control"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
          >
            {availableDates.map(d => (
              <option key={d} value={d}>{d.includes('Live') ? '⚡ ' + d : 'Snapshot: ' + d}</option>
            ))}
          </select>
        </div>

        {/* TA Profile Selector Button */}
        <button className="btn btn-secondary" onClick={onOpenTaModal}>
          <User size={15} style={{ color: 'var(--accent-purple)' }} />
          <span>{currentTaName || 'Select Profile'}</span>
        </button>

        {/* Sync Status Badge */}
        <div className="sync-status-badge" title="Auto-synced directly from Scaler raw Google Sheets">
          <div className="pulse-dot"></div>
          <Clock size={13} />
          <span>Live Sync: {formatLastSynced(lastSyncedAt)}</span>
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-primary btn-icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Fetch latest raw data from source sheets"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
        </button>
      </div>
    </header>
  );
}
