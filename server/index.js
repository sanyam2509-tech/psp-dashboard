import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { refreshData, getCache, normalizeDate } from './sheetsFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initial data fetch on server startup
refreshData().catch(err => console.error('Initial data fetch failed:', err));

// Meta endpoint: Available subjects, dates, TAs, last sync time, thresholds
app.get('/api/meta', (req, res) => {
  const cache = getCache();
  res.json({
    lastSyncedAt: cache.lastSyncedAt,
    subjects: cache.subjects,
    dates: (cache.dates || []).filter(d => d && !d.toLowerCase().includes('live')),
    taList: cache.taList,
    config: cache.config,
    kpiThresholds: {
      kpi1MaxBelow20Pct: 35,
      kpi2MinAvgPspPct: 40
    }
  });
});

// TA KPI Leaderboard / Overview endpoint
app.get('/api/ta-kpi', (req, res) => {
  const cache = getCache();
  const subject = req.query.subject || 'WEBDEV';
  const reqDate = req.query.date;
  const normReqDate = reqDate ? normalizeDate(reqDate) : null;

  let subjectRecords = cache.taHistory.filter(r => 
    r.subject && r.subject.toLowerCase() === subject.toLowerCase() && (!r.asOfDate || !r.asOfDate.toLowerCase().includes('live'))
  );

  let filtered = subjectRecords.filter(r => {
    return !reqDate || r.asOfDate === reqDate || r.normDate === normReqDate;
  });

  // Fallback to most recent date available for THIS subject if requested date has no records
  if (filtered.length === 0 && subjectRecords.length > 0) {
    const subjectDates = Array.from(new Set(subjectRecords.map(r => r.asOfDate)));
    const latestSubjectDate = subjectDates[0];
    const normLatest = normalizeDate(latestSubjectDate);
    filtered = subjectRecords.filter(r => r.asOfDate === latestSubjectDate || r.normDate === normLatest);
  }

  res.json({
    subject: subject,
    date: filtered[0]?.asOfDate || reqDate || '8/19/2026',
    asOfDate: filtered[0]?.asOfDate || reqDate || '8/19/2026',
    count: filtered.length,
    data: filtered
  });
});

// Student Roster / Drill-down endpoint
app.get('/api/students', (req, res) => {
  const cache = getCache();
  const taId = req.query.taId;
  const reqDate = req.query.date;
  const subject = req.query.subject;
  const normReqDate = reqDate ? normalizeDate(reqDate) : null;

  let students = cache.studentHistory.filter(s => !s.asOfDate || !s.asOfDate.toLowerCase().includes('live'));

  if (taId) {
    const cleanReqTa = taId.replace(/\s+/g, '').toLowerCase();
    students = students.filter(s => s.taId.replace(/\s+/g, '').toLowerCase() === cleanReqTa);
  }

  if (subject) {
    students = students.filter(s => s.subject.toLowerCase() === subject.toLowerCase());
  }

  // Filter by date if matched, but fallback to all available for this TA if date filter returns 0
  if (reqDate && students.length > 0) {
    const dateFiltered = students.filter(s => s.asOfDate === reqDate || s.normDate === normReqDate);
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
    ? (students.reduce((sum, s) => sum + s.pspPct, 0) / totalStudents).toFixed(1)
    : '0.0';

  res.json({
    taId: taId || 'ALL',
    asOfDate: students[0]?.asOfDate || reqDate || '8/19/2026',
    summary: {
      totalStudents,
      below20Count,
      below20Pct: totalStudents > 0 ? ((below20Count / totalStudents) * 100).toFixed(1) : '0.0',
      zeroSolversCount,
      totalAssigned,
      totalSolved,
      avgPspPct,
      kpi1Met: totalStudents > 0 ? ((below20Count / totalStudents) * 100) <= 35 : true,
      kpi2Met: parseFloat(avgPspPct) >= 40
    },
    students: students
  });
});

// Trend endpoint: Historical performance over time
app.get('/api/trends', (req, res) => {
  const cache = getCache();
  const taId = req.query.taId;
  const subject = req.query.subject || 'WEBDEV';

  let records = cache.taHistory.filter(r => r.subject.toLowerCase() === subject.toLowerCase());
  if (taId) {
    const cleanReqTa = taId.replace(/\s+/g, '').toLowerCase();
    records = records.filter(r => r.taId.replace(/\s+/g, '').toLowerCase() === cleanReqTa);
  }

  const trendMap = new Map();
  for (const r of records) {
    if (!trendMap.has(r.asOfDate)) {
      trendMap.set(r.asOfDate, []);
    }
    trendMap.get(r.asOfDate).push(r);
  }

  const trends = Array.from(trendMap.entries()).map(([date, list]) => {
    const avgKpi1 = (list.reduce((s, item) => s + item.kpi1Pct, 0) / list.length).toFixed(1);
    const avgKpi2 = (list.reduce((s, item) => s + item.kpi2Pct, 0) / list.length).toFixed(1);
    return {
      date,
      kpi1Pct: parseFloat(avgKpi1),
      kpi2Pct: parseFloat(avgKpi2),
      taCount: list.length
    };
  });

  res.json({
    taId: taId || 'ALL',
    subject,
    trends
  });
});

// Force manual refresh
app.post('/api/refresh', async (req, res) => {
  try {
    const updated = await refreshData();
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      lastSyncedAt: updated.lastSyncedAt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Serve Vite production build static assets if present
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) res.status(404).send('API Server Running. Build frontend with `npm run build` in /client.');
  });
});

app.listen(PORT, () => {
  console.log(`PSP Dashboard Server running on http://localhost:${PORT}`);
});
