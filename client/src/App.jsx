import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TASearchModal from './components/TASearchModal';
import AtRiskBanner from './components/AtRiskBanner';
import MenteeRoster from './components/MenteeRoster';
import TALeaderboard from './components/TALeaderboard';
import AnalyticsCharts from './components/AnalyticsCharts';
import OnboardingLanding from './components/OnboardingLanding';
import { getStaticMeta, getStaticTaKpi, getStaticStudents } from './staticDataLoader';
import { Users, AlertOctagon, CheckCircle2, Award, Zap, UserCheck, ShieldCheck, ShieldAlert, LogOut } from 'lucide-react';

export default function App() {
  const [meta, setMeta] = useState(null);

  // Subject state
  const [subject, setSubject] = useState(() => {
    return localStorage.getItem('psp_saved_subject') || 'WEBDEV';
  });

  const [asOfDate, setAsOfDate] = useState('8/19/2026');

  // TA profile state (null by default for first-time users)
  const [currentTaId, setCurrentTaId] = useState(() => {
    return localStorage.getItem('psp_saved_ta_id') || null;
  });
  const [currentTaName, setCurrentTaName] = useState(() => {
    return localStorage.getItem('psp_saved_ta_name') || null;
  });

  const [isTaModalOpen, setIsTaModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('MENTEES'); // MENTEES | ALL_TAS

  // Data states
  const [taData, setTaData] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch Meta (with static fallback)
  const fetchMeta = async () => {
    try {
      const res = await fetch('/api/meta');
      if (res.ok) {
        const data = await res.json();
        setMeta(data);
        if (data.dates && data.dates.length > 0 && !data.dates.includes(asOfDate)) {
          setAsOfDate(data.dates[0]);
        }
        return;
      }
    } catch (e) {
      // Fallback for static GitHub Pages host
    }
    const staticMeta = getStaticMeta();
    setMeta(staticMeta);
    if (staticMeta.dates && staticMeta.dates.length > 0 && !staticMeta.dates.includes(asOfDate)) {
      setAsOfDate(staticMeta.dates[0]);
    }
  };

  // Fetch TA Leaderboard Data (with static fallback)
  const fetchTaData = useCallback(async () => {
    try {
      const res = await fetch(`/api/ta-kpi?subject=${subject}&date=${encodeURIComponent(asOfDate)}`);
      if (res.ok) {
        const json = await res.json();
        setTaData(json.data || []);
        return;
      }
    } catch (e) {
      // Fallback for static GitHub Pages host
    }
    const staticData = getStaticTaKpi(subject, asOfDate);
    setTaData(staticData.data || []);
  }, [subject, asOfDate]);

  // Fetch Student Roster Data for current TA (with static fallback)
  const fetchStudentData = useCallback(async () => {
    if (!currentTaId) return;
    try {
      const res = await fetch(`/api/students?taId=${encodeURIComponent(currentTaId)}&subject=${subject}&date=${encodeURIComponent(asOfDate)}`);
      if (res.ok) {
        const json = await res.json();
        setStudentData(json);
        return;
      }
    } catch (e) {
      // Fallback for static GitHub Pages host
    }
    const staticStudentData = getStaticStudents(currentTaId, subject, asOfDate);
    setStudentData(staticStudentData);
  }, [currentTaId, subject, asOfDate]);

  // Combined fetch
  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMeta(), fetchTaData(), fetchStudentData()]);
    setLoading(false);
  }, [fetchTaData, fetchStudentData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      if (res.ok) {
        await loadAll();
      } else {
        await loadAll();
      }
    } catch (e) {
      await loadAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  // TA selection handler
  const handleSelectTa = (ta) => {
    setCurrentTaId(ta.taId);
    setCurrentTaName(ta.taName);
    localStorage.setItem('psp_saved_ta_id', ta.taId);
    localStorage.setItem('psp_saved_ta_name', ta.taName);
  };

  // Onboarding completion handler
  const handleCompleteOnboarding = (selectedSubj, selectedTa) => {
    setSubject(selectedSubj);
    setCurrentTaId(selectedTa.taId);
    setCurrentTaName(selectedTa.taName);
    localStorage.setItem('psp_saved_subject', selectedSubj);
    localStorage.setItem('psp_saved_ta_id', selectedTa.taId);
    localStorage.setItem('psp_saved_ta_name', selectedTa.taName);
  };

  // Reset / Clear Profile (Exit Dashboard to Landing)
  const handleResetProfile = () => {
    setCurrentTaId(null);
    setCurrentTaName(null);
    localStorage.removeItem('psp_saved_ta_id');
    localStorage.removeItem('psp_saved_ta_name');
  };

  // Get active TA list for selected subject
  const currentSubjectTaList = meta?.taList?.[subject] || [];

  // Show Onboarding Landing Screen if no profile is set
  if (!currentTaId || !currentTaName) {
    return (
      <OnboardingLanding
        availableSubjects={meta?.subjects || ['WEBDEV', 'MERN', 'ICP']}
        taListBySubject={meta?.taList || {}}
        onCompleteOnboarding={handleCompleteOnboarding}
      />
    );
  }

  const summary = studentData?.summary || {
    totalStudents: 0,
    below20Count: 0,
    below20Pct: '0.0',
    zeroSolversCount: 0,
    totalAssigned: 0,
    totalSolved: 0,
    avgPspPct: '0.0',
    kpi1Met: true,
    kpi2Met: false
  };

  return (
    <div className="app-container">
      <Header
        subject={subject}
        setSubject={(s) => {
          setSubject(s);
          localStorage.setItem('psp_saved_subject', s);
        }}
        asOfDate={asOfDate}
        setAsOfDate={setAsOfDate}
        availableSubjects={meta?.subjects || ['WEBDEV', 'MERN', 'ICP']}
        availableDates={meta?.dates || ['8/19/2026', '8/18/2026']}
        currentTaName={currentTaName}
        onOpenTaModal={() => setIsTaModalOpen(true)}
        lastSyncedAt={meta?.lastSyncedAt}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="main-content">
        {/* Navigation & Controls Bar */}
        <div className="controls-bar">
          <div className="view-tabs">
            <button
              className={`view-tab ${viewMode === 'MENTEES' ? 'active' : ''}`}
              onClick={() => setViewMode('MENTEES')}
            >
              My Squad ({currentTaName})
            </button>
            <button
              className={`view-tab ${viewMode === 'ALL_TAS' ? 'active' : ''}`}
              onClick={() => setViewMode('ALL_TAS')}
            >
              All TAs Performance ({taData.length} TAs)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsTaModalOpen(true)} style={{ fontSize: '0.8rem' }}>
              <UserCheck size={14} style={{ color: 'var(--accent-blue)' }} />
              <span>Switch TA</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleResetProfile}
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
              title="Log out and return to onboarding landing screen"
            >
              <LogOut size={14} />
              <span>Exit Profile</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
            <Zap className="spin" size={36} style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Calculating Live PSP Analytics...</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Auto-discovering raw source sheets & aggregating student progress
            </div>
          </div>
        ) : (
          <>
            {/* TA Squad Hero Card */}
            <div className="ta-hero-banner">
              <div className="ta-hero-info">
                <div className="ta-avatar">
                  {currentTaName.charAt(0)}
                </div>
                <div className="ta-title-group">
                  <h2>{currentTaName}'s Squad Overview</h2>
                  <p>Subject: <strong style={{ color: 'var(--text-primary)' }}>{subject}</strong> &bull; TA ID: <span className="font-mono">{currentTaId}</span></p>
                </div>
              </div>

              <div className="ta-hero-badges">
                {summary.kpi1Met && summary.kpi2Met ? (
                  <span className="badge badge-green" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <ShieldCheck size={16} /> Both KPIs Met ✅
                  </span>
                ) : (
                  <span className="badge badge-yellow" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} /> Action Needed ⚠️
                  </span>
                )}
              </div>
            </div>

            {/* Top KPI Cards Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-title">
                  <span>Assigned Mentees</span>
                  <Users size={16} className="text-muted" />
                </div>
                <div className="stat-card-value">{summary.totalStudents}</div>
                <div className="stat-card-sub">Active students in your squad</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">
                  <span>Average PSP %</span>
                  <Award size={16} style={{ color: summary.kpi2Met ? 'var(--status-green)' : 'var(--status-red)' }} />
                </div>
                <div className="stat-card-value" style={{ color: summary.kpi2Met ? 'var(--status-green)' : 'var(--status-red)' }}>
                  {summary.avgPspPct}%
                </div>
                <div className="stat-card-sub">
                  Target: &ge; 40% ({summary.kpi2Met ? '✅ Target Met' : '❌ Target Failed'})
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">
                  <span>Below 20% PSP</span>
                  <AlertOctagon size={16} style={{ color: summary.kpi1Met ? 'var(--status-green)' : 'var(--status-red)' }} />
                </div>
                <div className="stat-card-value" style={{ color: summary.kpi1Met ? 'var(--status-green)' : 'var(--status-red)' }}>
                  {summary.below20Pct}%
                </div>
                <div className="stat-card-sub">
                  {summary.below20Count} mentees | Max Limit: &le; 35% ({summary.kpi1Met ? '✅ Met' : '❌ Exceeded'})
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">
                  <span>Problems Solved</span>
                  <CheckCircle2 size={16} className="text-muted" />
                </div>
                <div className="stat-card-value font-mono">
                  {summary.totalSolved} <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>/ {summary.totalAssigned}</span>
                </div>
                <div className="stat-card-sub">Total cumulative problems solved</div>
              </div>
            </div>

            {/* At Risk Alert Banner */}
            <AtRiskBanner summary={summary} students={studentData?.students || []} />

            {/* Visual Charts */}
            <AnalyticsCharts students={studentData?.students || []} taData={taData} />

            {/* View Switch: Mentee Roster vs All TAs */}
            {viewMode === 'MENTEES' ? (
              <MenteeRoster
                students={studentData?.students || []}
                taName={currentTaName}
              />
            ) : (
              <TALeaderboard
                taData={taData}
                currentTaId={currentTaId}
                onSelectTa={(ta) => {
                  handleSelectTa(ta);
                  setViewMode('MENTEES');
                }}
                subject={subject}
              />
            )}
          </>
        )}
      </main>

      {/* TA Search / Selection Modal */}
      <TASearchModal
        isOpen={isTaModalOpen}
        onClose={() => setIsTaModalOpen(false)}
        taList={currentSubjectTaList}
        currentTaId={currentTaId}
        onSelectTa={handleSelectTa}
      />
    </div>
  );
}
