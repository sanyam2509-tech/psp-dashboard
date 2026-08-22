import { parse } from 'csv-parse/sync';

const MASTER_SHEET_ID = '1owJiE2TUyoi-wD8seeDcyV9YTjE--knatPeaCm-TpRU';

const GIDS = {
  DASHBOARD: '1732981435',
  TA_KPI_HISTORY: '877357179',
  STUDENT_KPI_HISTORY: '2051637277',
  CONFIG: '350844426'
};

const MONTH_MAP = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

export function normalizeDate(d) {
  if (!d) return '';
  d = String(d).trim();
  if (d.includes('-')) {
    const parts = d.split('-');
    if (parts.length === 3) {
      if (isNaN(parts[1])) {
        const day = parts[0].padStart(2, '0');
        const month = MONTH_MAP[parts[1].toLowerCase().slice(0, 3)] || '08';
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${month}-${day}`;
      } else {
        if (parts[0].length === 4) return d;
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
  }
  if (d.includes('/')) {
    const parts = d.split('/');
    if (parts.length === 3) {
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return d;
}

function parseHeaderCsv(csvText, keyword) {
  if (!csvText) return [];
  const lines = csvText.split('\n');
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(keyword) && line.includes(',')) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return [];
  const validCsv = lines.slice(headerIndex).join('\n');
  return parse(validCsv, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

async function fetchCsv(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    if (!response.ok) {
      console.error(`Failed to fetch CSV from ${url}: HTTP ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err);
    return null;
  }
}

let cache = {
  lastSyncedAt: null,
  config: [],
  taHistory: [],
  studentHistory: [],
  subjects: ['WEBDEV', 'MERN', 'ICP'],
  dates: ['8/19/2026', '8/18/2026'],
  taList: {}
};

export async function refreshData() {
  const now = new Date();
  console.log('[SheetsFetcher] Ingesting Google Sheet data...');

  // 1. Fetch Configuration Tab
  const configUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.CONFIG}`;
  const configCsv = await fetchCsv(configUrl);
  let parsedConfig = [];
  if (configCsv) {
    try {
      const records = parseHeaderCsv(configCsv, 'Subject');
      parsedConfig = records.map(r => ({
        subject: (r['Subject'] || '').trim(),
        sourceSheetId: (r['PSP Source Sheet ID'] || '').trim(),
        crmRosterName: (r['CRM Roster Sheet Name'] || '').trim(),
        notes: (r['Notes'] || '').trim()
      })).filter(c => c.subject && c.sourceSheetId);
    } catch (e) {
      console.error('Error parsing Configuration CSV:', e);
    }
  }

  // 2. Fetch Master TA KPI History Tab
  const taUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.TA_KPI_HISTORY}`;
  const taCsv = await fetchCsv(taUrl);
  let masterTaHistory = [];
  if (taCsv) {
    try {
      const records = parseHeaderCsv(taCsv, 'As Of Date');
      masterTaHistory = records.map(r => {
        const rawDate = (r['As Of Date'] || r['﻿As Of Date'] || Object.values(r)[0] || '').trim();
        return {
          asOfDate: rawDate,
          normDate: normalizeDate(rawDate),
          subject: (r['Subject'] || 'WEBDEV').trim(),
          taId: (r['TA ID'] || '').trim(),
          taName: (r['TA Name'] || '').trim(),
          numStudents: parseInt(r['Number of Students'] || '0', 10),
          kpi1Pct: parseFloat(r['KPI 1 % (Below 20 PSP)'] || '0'),
          kpi2Pct: parseFloat(r['KPI 2 % (Average PSP)'] || '0'),
          kpi1Met: parseFloat(r['KPI 1 % (Below 20 PSP)'] || '0') <= 35,
          kpi2Met: parseFloat(r['KPI 2 % (Average PSP)'] || '0') >= 40,
          rank: parseInt(r['Group Rank (helper)'] || '0', 10)
        };
      }).filter(r => r.taId);
    } catch (e) {
      console.error('Error parsing TA KPI History CSV:', e);
    }
  }

  // 3. Fetch Master Dashboard Tab
  const dashUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.DASHBOARD}`;
  const dashCsv = await fetchCsv(dashUrl);
  let dashStudents = [];
  let dashDate = '8/19/2026';
  let dashSubject = 'WEBDEV';
  let dashTaId = 'INT_WEBDEV_TA13';

  if (dashCsv) {
    try {
      const lines = parse(dashCsv, { skip_empty_lines: false, relax_column_count: true });
      for (let i = 0; i < lines.length; i++) {
        const row = lines[i];
        if (row[0] === 'Subject:' && row[1]) dashSubject = row[1];
        if (row[2] && row[3]) dashDate = row[3];
        if (row[0] === 'Drill into TA ID:' && row[1]) dashTaId = row[1];
        if (row[0] === 'Student Email' && row[1] === 'Student Name') {
          for (let j = i + 1; j < lines.length; j++) {
            const sRow = lines[j];
            if (!sRow[0] || sRow[0].trim() === '' || !sRow[0].includes('@')) break;
            const assigned = parseInt(sRow[2] || '0', 10);
            const solved = parseInt(sRow[3] || '0', 10);
            const pspPct = parseFloat((sRow[4] || '0').replace('%', ''));
            dashStudents.push({
              asOfDate: dashDate,
              normDate: normalizeDate(dashDate),
              subject: dashSubject,
              email: sRow[0].trim().toLowerCase(),
              name: sRow[1].trim(),
              taId: dashTaId.trim(),
              assigned: assigned,
              solved: solved,
              pspPct: pspPct,
              isBelow20: sRow[5] === 'Yes' || pspPct < 20
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing Dashboard CSV:', e);
    }
  }

  // 4. Fetch Master Student KPI History Tab
  const studentUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.STUDENT_KPI_HISTORY}`;
  const studentCsv = await fetchCsv(studentUrl);
  let masterStudentHistory = [];
  if (studentCsv) {
    try {
      const records = parseHeaderCsv(studentCsv, 'Student Email');
      masterStudentHistory = records.map(r => {
        const rawDate = (r['As Of Date'] || r['﻿As Of Date'] || Object.values(r)[0] || '').trim();
        const assigned = parseInt(r['Total Assigned'] || '0', 10);
        const solved = parseInt(r['Total Solved'] || '0', 10);
        const pspPct = parseFloat(r['PSP %'] || (assigned > 0 ? ((solved / assigned) * 100).toFixed(1) : '0'));
        return {
          asOfDate: rawDate,
          normDate: normalizeDate(rawDate),
          subject: (r['Subject'] || 'WEBDEV').trim(),
          email: (r['Student Email'] || '').trim().toLowerCase(),
          name: (r['Student Name'] || '').trim(),
          taId: (r['TA ID'] || '').trim(),
          assigned: assigned,
          solved: solved,
          pspPct: pspPct,
          isBelow20: r['Below 20%?'] === 'Yes' || pspPct < 20
        };
      }).filter(r => r.email && r.taId);
    } catch (e) {
      console.error('Error parsing Student KPI History CSV:', e);
    }
  }

  const allTaHistory = [...masterTaHistory];
  const allStudentHistory = [...dashStudents, ...masterStudentHistory];

  const subjects = ['WEBDEV', 'MERN', 'ICP'];
  const rawMasterDates = Array.from(new Set(masterTaHistory.map(r => r.asOfDate))).filter(d => d && !d.toLowerCase().includes('live'));
  rawMasterDates.sort((a, b) => normalizeDate(b).localeCompare(normalizeDate(a)));
  
  const dates = rawMasterDates.length > 0 ? rawMasterDates : ['8/19/2026', '8/18/2026'];

  // Build Complete TA Directory per Subject (Extracted from allStudentHistory + masterTaHistory)
  const taList = {};
  for (const sub of subjects) {
    const uniqueMap = new Map();

    // First add from masterTaHistory
    const subjectTaHist = masterTaHistory.filter(r => r.subject.toUpperCase() === sub.toUpperCase());
    for (const ta of subjectTaHist) {
      const cleanTaId = ta.taId.replace(/\s+/g, '');
      if (cleanTaId && !uniqueMap.has(cleanTaId)) {
        uniqueMap.set(cleanTaId, {
          taId: ta.taId,
          cleanTaId: cleanTaId,
          taName: ta.taName || ta.taId
        });
      }
    }

    // Next add any TAs found in student history
    const subjectStudents = allStudentHistory.filter(s => s.subject.toUpperCase() === sub.toUpperCase());
    for (const s of subjectStudents) {
      const cleanTaId = s.taId.replace(/\s+/g, '');
      if (cleanTaId && !uniqueMap.has(cleanTaId)) {
        uniqueMap.set(cleanTaId, {
          taId: s.taId,
          cleanTaId: cleanTaId,
          taName: s.taId
        });
      }
    }

    taList[sub] = Array.from(uniqueMap.values());
  }

  cache = {
    lastSyncedAt: now.toISOString(),
    config: parsedConfig,
    taHistory: allTaHistory,
    studentHistory: allStudentHistory,
    subjects: subjects,
    dates: dates,
    taList: taList
  };

  console.log(`[SheetsFetcher] Ingestion finished! ${allStudentHistory.length} student records across ${allTaHistory.length} TA records.`);
  return cache;
}

export function getCache() {
  return cache;
}

// Auto-refresh every 5 minutes from Google Sheets
setInterval(() => {
  refreshData().catch(err => console.error('[SheetsFetcher] Auto-refresh failed:', err));
}, 5 * 60 * 1000);
