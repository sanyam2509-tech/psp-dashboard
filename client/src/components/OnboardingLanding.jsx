import React, { useState } from 'react';
import { BookOpen, User, Sparkles, ChevronRight, Search, CheckCircle2, ShieldCheck, BarChart3, Users } from 'lucide-react';

export default function OnboardingLanding({
  availableSubjects = ['WEBDEV', 'MERN', 'ICP'],
  taListBySubject = {},
  onCompleteOnboarding
}) {
  const [selectedSubject, setSelectedSubject] = useState('WEBDEV');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTa, setSelectedTa] = useState(null);

  const activeTaList = taListBySubject[selectedSubject] || [];

  const filteredTAs = activeTaList.filter(ta =>
    ta.taName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ta.taId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubjectChange = (subj) => {
    setSelectedSubject(subj);
    setSelectedTa(null);
    setSearchQuery('');
  };

  const handleStart = () => {
    if (selectedTa) {
      onCompleteOnboarding(selectedSubject, selectedTa);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.12) 0%, rgba(8, 12, 20, 1) 70%)'
    }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)'
          }}>
            PSP
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Welcome to Scaler PSP Analytics
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
            Track live mentee problem-solving percentages, identify at-risk students, and monitor your TA squad KPI benchmarks.
          </p>
        </div>

        {/* Features Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '0.85rem',
            textAlign: 'center'
          }}>
            <Users size={18} style={{ color: '#3b82f6', marginBottom: '0.3rem' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Squad Roster</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Assigned mentees</div>
          </div>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '0.85rem',
            textAlign: 'center'
          }}>
            <ShieldCheck size={18} style={{ color: '#10b981', marginBottom: '0.3rem' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>KPI Tracking</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>KPI 1 & KPI 2 status</div>
          </div>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '0.85rem',
            textAlign: 'center'
          }}>
            <BarChart3 size={18} style={{ color: '#8b5cf6', marginBottom: '0.3rem' }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Cross-TA Overview</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Subject benchmarks</div>
          </div>
        </div>

        {/* Step 1: Select Subject */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
            marginBottom: '0.6rem'
          }}>
            Step 1: Select Your Subject
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {availableSubjects.map(subj => {
              const isSelected = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => handleSubjectChange(subj)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #1e293b',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <BookOpen size={15} />
                  <span>{subj}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select TA Profile */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
            marginBottom: '0.6rem'
          }}>
            Step 2: Select Your TA Profile ({selectedSubject})
          </label>

          {/* Search Box */}
          <div className="search-box" style={{ width: '100%', marginBottom: '0.75rem' }}>
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={`Search ${selectedSubject} TAs by name or ID...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* TA Selection Scroll List */}
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '0.5rem',
            backgroundColor: '#090d16'
          }}>
            {filteredTAs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                No TAs found matching "{searchQuery}"
              </div>
            ) : (
              filteredTAs.map(ta => {
                const isSelected = selectedTa?.taId === ta.taId;
                return (
                  <div
                    key={ta.taId}
                    onClick={() => setSelectedTa(ta)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                        {ta.taName}
                      </div>
                      <div className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {ta.taId}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} style={{ color: '#3b82f6' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="btn btn-primary"
          onClick={handleStart}
          disabled={!selectedTa}
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '1rem',
            borderRadius: '12px',
            opacity: selectedTa ? 1 : 0.4,
            cursor: selectedTa ? 'pointer' : 'not-allowed'
          }}
        >
          <span>Open Dashboard for {selectedTa ? selectedTa.taName : 'Selected TA'}</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
