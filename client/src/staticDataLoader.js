import snapshotData from './dataSnapshot.json';

export function getStaticMeta() {
  return {
    lastSyncedAt: snapshotData.lastSyncedAt,
    subjects: snapshotData.subjects || ['WEBDEV', 'MERN', 'ICP'],
    dates: snapshotData.dates || ['Live Real-Time (8/22/2026)', '8/19/2026', '8/18/2026'],
    taList: snapshotData.taList || {},
    config: snapshotData.config || [],
    kpiThresholds: {
      kpi1MaxBelow20Pct: 35,
      kpi2MinAvgPspPct: 40
    }
  };
}

export function getStaticTaKpi(subject = 'WEBDEV', reqDate = '8/19/2026') {
  let filtered = (snapshotData.taHistory || []).filter(r => {
    const subjectMatch = !subject || r.subject.toLowerCase() === subject.toLowerCase();
    const dateMatch = !reqDate || r.asOfDate === reqDate || r.normDate === reqDate;
    return subjectMatch && dateMatch;
  });

  if (filtered.length === 0 && snapshotData.taHistory?.length > 0) {
    const latestDate = snapshotData.dates[0];
    filtered = snapshotData.taHistory.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
  }

  return {
    subject,
    date: reqDate,
    asOfDate: filtered[0]?.asOfDate || reqDate,
    count: filtered.length,
    data: filtered
  };
}

export function getStaticStudents(taId, subject, reqDate) {
  let students = snapshotData.studentHistory || [];

  if (taId) {
    const cleanReqTa = taId.replace(/\s+/g, '').toLowerCase();
    students = students.filter(s => s.taId.replace(/\s+/g, '').toLowerCase() === cleanReqTa);
  }

  if (subject) {
    students = students.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
  }

  if (reqDate && students.length > 0) {
    const dateFiltered = students.filter(s => s.asOfDate === reqDate);
    if (dateFiltered.length > 0) {
      students = dateFiltered;
    }
  }

  const totalStudents = students.length;
  const below20Count = students.filter(s => s.isBelow20).length;
  const zeroSolversCount = students.filter(s => s.solved === 0).length;
  const totalAssigned = students.reduce((sum, s) => sum + s.assigned, 0);
  const totalSolved = students.reduce((sum, s) => sum + s.solved, 0);
  const avgPspPct = totalStudents > 0 ? (totalSolved / (totalStudents * (students[0]?.assigned || 1)) * 100).toFixed(1) : '0.0';
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
