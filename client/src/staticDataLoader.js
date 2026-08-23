import snapshotData from './dataSnapshot.json';

export function getStaticMeta() {
  const dates = (snapshotData.dates || ['8/19/2026', '8/18/2026']).filter(d => d && !d.toLowerCase().includes('live'));
  return {
    lastSyncedAt: snapshotData.lastSyncedAt,
    subjects: snapshotData.subjects || ['WEBDEV', 'MERN', 'ICP'],
    dates: dates,
    taList: snapshotData.taList || {},
    config: snapshotData.config || [],
    kpiThresholds: {
      kpi1MaxBelow20Pct: 35,
      kpi2MinAvgPspPct: 40
    }
  };
}

export function getStaticTaKpi(subject = 'WEBDEV', reqDate = '8/19/2026') {
  const cleanReqDate = reqDate && reqDate.toLowerCase().includes('live') ? '8/19/2026' : reqDate;
  
  let subjectRecords = (snapshotData.taHistory || []).filter(r => 
    r.subject && r.subject.toLowerCase() === subject.toLowerCase() && (!r.asOfDate || !r.asOfDate.toLowerCase().includes('live'))
  );

  let filtered = subjectRecords.filter(r => r.asOfDate === cleanReqDate || r.normDate === cleanReqDate);

  // If requested date has no records for this subject (e.g. MERN on 8/19), auto-fallback to latest date that has records for this subject
  if (filtered.length === 0 && subjectRecords.length > 0) {
    const availableDatesForSubject = Array.from(new Set(subjectRecords.map(r => r.asOfDate)));
    const latestSubjectDate = availableDatesForSubject[0];
    filtered = subjectRecords.filter(r => r.asOfDate === latestSubjectDate);
  }

  return {
    subject,
    date: filtered[0]?.asOfDate || cleanReqDate || '8/19/2026',
    asOfDate: filtered[0]?.asOfDate || cleanReqDate || '8/19/2026',
    count: filtered.length,
    data: filtered
  };
}

export function getStaticStudents(taId, subject, reqDate) {
  const cleanReqDate = reqDate && reqDate.toLowerCase().includes('live') ? '8/19/2026' : reqDate;

  let students = (snapshotData.studentHistory || []).filter(s => !s.asOfDate || !s.asOfDate.toLowerCase().includes('live'));

  if (taId && taId.toUpperCase() !== 'ALL') {
    const cleanReqTa = taId.replace(/\s+/g, '').toLowerCase();
    students = students.filter(s => s.taId && s.taId.replace(/\s+/g, '').toLowerCase() === cleanReqTa);
  }

  if (subject) {
    students = students.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
  }

  if (cleanReqDate && students.length > 0) {
    const dateFiltered = students.filter(s => s.asOfDate === cleanReqDate);
    if (dateFiltered.length > 0) {
      students = dateFiltered;
    }
  }

  const totalStudents = students.length;
  const below20Count = students.filter(s => s.isBelow20).length;
  const zeroSolversCount = students.filter(s => s.solved === 0).length;
  const totalAssigned = students.reduce((sum, s) => sum + s.assigned, 0);
  const totalSolved = students.reduce((sum, s) => sum + s.solved, 0);
  const avgPspPct = totalStudents > 0
    ? (students.reduce((sum, s) => sum + (isNaN(s.pspPct) ? 0 : s.pspPct), 0) / totalStudents).toFixed(1)
    : '0.0';
  const below20Pct = totalStudents > 0 ? ((below20Count / totalStudents) * 100).toFixed(1) : '0.0';

  return {
    taId,
    subject,
    summary: {
      totalStudents,
      below20Count,
      below20Pct,
      zeroSolversCount,
      totalAssigned,
      totalSolved,
      avgPspPct,
      kpi1Met: parseFloat(below20Pct) <= 35,
      kpi2Met: parseFloat(avgPspPct) >= 40
    },
    students
  };
}
