import React, { useState } from 'react';
import { Search, X, CheckCircle, User } from 'lucide-react';

export default function TASearchModal({
  isOpen,
  onClose,
  taList = [],
  currentTaId,
  onSelectTa
}) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = taList.filter(ta =>
    ta.taName.toLowerCase().includes(search.toLowerCase()) ||
    ta.taId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User className="text-muted" size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select Your TA Profile</h3>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Choose your profile to automatically load your assigned mentees on every visit. Saved to local storage.
          </p>

          <div className="search-box" style={{ width: '100%', marginBottom: '1rem' }}>
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search TA by name or ID (e.g. Sanyam Singla, TA13)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                No TAs found matching "{search}"
              </div>
            ) : (
              filtered.map(ta => {
                const isSelected = ta.taId === currentTaId;
                return (
                  <div
                    key={ta.taId}
                    className={`ta-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectTa(ta);
                      onClose();
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{ta.taName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="font-mono">
                        {ta.taId}
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle size={18} style={{ color: 'var(--accent-blue)' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
