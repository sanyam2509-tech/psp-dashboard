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
      if (keyword === 'TA ID' && line.includes('TA Name')) {
        headerIndex = i;
        break;
      }
      if (keyword === 'Student Email' && line.includes('Student Name')) {
        headerIndex = i;
        break;
      }
    }
  }
  if (headerIndex === -1) return [];
  const trimmedCsv = lines.slice(headerIndex).join('\n');
  return parse(trimmedCsv, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

async function fetchCsv(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
    return await res.text();
  } catch (err) {
    console.error(`Failed to fetch CSV from ${url}:`, err.message);
    return null;
  }
}

// Dynamically discover all worksheet GIDs for a Google Sheet ID
async function discoverSheetGids(sheetId) {
  try {
    const html = await fetchCsv(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
    if (!html) return [''];
    const matches = html.match(/gid=([0-9]+)/g);
    if (!matches) return [''];
    const gids = Array.from(new Set(matches.map(m => m.replace('gid=', ''))));
    return gids.length > 0 ? gids : [''];
  } catch (e) {
    return [''];
  }
}

let cache = {
  lastSyncedAt: null,
  config: [],
  taHistory: [],
  studentHistory: [],
  subjects: [],
  dates: [],
  taList: {}
};

export async function refreshData() {
  console.log('[SheetsFetcher] Running fully dynamic live real-time ingestion on raw source sheets...');
  const now = new Date();
  const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  const liveDateLabel = `Live Real-Time (${todayStr})`;

  // 1. Fetch Configuration Tab dynamically
  const configUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.CONFIG}`;
  const configCsv = await fetchCsv(configUrl);
  let parsedConfig = [];
  if (configCsv) {
    try {
      const records = parse(configCsv, { skip_empty_lines: true, relax_column_count: true });
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        if (row[0] === 'MERN' || row[0] === 'ICP' || row[0] === 'WEBDEV') {
          parsedConfig.push({
            subject: row[0],
            sourceSheetId: row[1],
            crmRosterName: row[2],
            notes: row[3] || ''
          });
        }
      }
    } catch (e) {
      console.error('Error parsing config CSV:', e);
    }
  }

  // 2. Fetch Master TA KPI History Tab (Historical Snapshots)
  const taUrl = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/export?format=csv&gid=${GIDS.TA_KPI_HISTORY}`;
  const taCsv = await fetchCsv(taUrl);
  let masterTaHistory = [];
  if (taCsv) {
    try {
      const records = parseHeaderCsv(taCsv, 'TA ID');
      masterTaHistory = records.map(r => {
        const rawDate = (r['As Of Date'] || r['﻿As Of Date'] || Object.values(r)[0] || '').trim();
        const taId = (r['TA ID'] || '').trim();
        return {
          asOfDate: rawDate,
          normDate: normalizeDate(rawDate),
          subject: (r['Subject'] || 'WEBDEV').trim(),
          taId: taId,
          taName: (r['TA Name'] || taId).trim(),
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

  // Build Comprehensive Student-to-TA Mapping across all master tabs
  const studentTaMap = new Map(); // subject:email -> { email, name, taId, taName, subject }
  for (const s of [...masterStudentHistory, ...dashStudents]) {
    const key = `${s.subject}:${s.email}`;
    if (!studentTaMap.has(key)) {
      const taMatch = masterTaHistory.find(t => t.taId.replace(/\s+/g, '') === s.taId.replace(/\s+/g, ''));
      studentTaMap.set(key, {
        email: s.email,
        name: s.name,
        taId: s.taId,
        taName: taMatch?.taName || s.taId,
        subject: s.subject
      });
    }
  }

  const taNameLookup = new Map();
  for (const t of masterTaHistory) {
    if (t.taId && t.taName) {
      taNameLookup.set(t.taId.replace(/\s+/g, ''), t.taName);
    }
  }

  // 5. DYNAMIC REAL-TIME INGESTION OF RAW PSP SOURCE SHEETS (AUTO-DISCOVERS ALL GIDS)
  let liveStudents = [];
  let liveTaStats = new Map(); // subject:cleanTaId -> { subject, taId, taName, numStudents, below20Count, sumPspPct }

  for (const cfg of parsedConfig) {
    if (cfg.sourceSheetId) {
      const gids = await discoverSheetGids(cfg.sourceSheetId);
      
      let bestRecords = [];
      let maxRows = 0;

      for (const gid of gids) {
        const srcUrl = `https://docs.google.com/spreadsheets/d/${cfg.sourceSheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
        const srcCsv = await fetchCsv(srcUrl);
        if (srcCsv) {
          try {
            const records = parse(srcCsv, { columns: true, skip_empty_lines: true, relax_column_count: true });
            if (records.length > maxRows && records[0]?.['email'] && records[0]?.['assignment_problems']) {
              maxRows = records.length;
              bestRecords = records;
            }
          } catch (e) {
            // Ignore non-data tabs
          }
        }
      }

      if (bestRecords.length > 0) {
        // Aggregate problem assignments & solutions per student dynamically
        const studentAgg = new Map(); // email -> { assigned, solved }
        for (const r of bestRecords) {
          const email = (r['email'] || '').trim().toLowerCase();
          if (!email) continue;
          const prob = parseInt(r['assignment_problems'] || '0', 10);
          const solved = parseInt(r['assignments_solved'] || '0', 10);

          if (!studentAgg.has(email)) {
            studentAgg.set(email, { assigned: 0, solved: 0 });
          }
          const agg = studentAgg.get(email);
          agg.assigned += prob;
          agg.solved += solved;
        }

        // Calculate Live Real-Time PSP for all students in this subject
        for (const [email, agg] of studentAgg.entries()) {
          const mapMatch = studentTaMap.get(`${cfg.subject}:${email}`);
          if (!mapMatch) continue;

          const taId = mapMatch.taId;
          const cleanTaId = taId.replace(/\s+/g, '');
          const taName = mapMatch.taName || taNameLookup.get(cleanTaId) || taId;
          const name = mapMatch.name || email.split('@')[0];
          const pspPct = agg.assigned > 0 ? parseFloat(((agg.solved / agg.assigned) * 100).toFixed(1)) : 0.0;
          const isBelow20 = pspPct < 20.0;

          liveStudents.push({
            asOfDate: liveDateLabel,
            normDate: normalizeDate(todayStr),
            subject: cfg.subject,
            email: email,
            name: name,
            taId: taId,
            taName: taName,
            assigned: agg.assigned,
            solved: agg.solved,
            pspPct: pspPct,
            isBelow20: isBelow20
          });

          const taKey = `${cfg.subject}:${cleanTaId}`;
          if (!liveTaStats.has(taKey)) {
            liveTaStats.set(taKey, {
              subject: cfg.subject,
              taId: taId,
              taName: taName,
              numStudents: 0,
              below20Count: 0,
              sumPspPct: 0.0
            });
          }
          const taSt = liveTaStats.get(taKey);
          taSt.numStudents += 1;
          if (isBelow20) taSt.below20Count += 1;
          taSt.sumPspPct += pspPct;
        }
      }
    }
  }

  // Convert Live TA Stats to TA Leaderboard rows
  let liveTaHistory = [];
  for (const [key, st] of liveTaStats.entries()) {
    const kpi1 = st.numStudents > 0 ? parseFloat(((st.below20Count / st.numStudents) * 100).toFixed(1)) : 0.0;
    const kpi2 = st.numStudents > 0 ? parseFloat((st.sumPspPct / st.numStudents).toFixed(1)) : 0.0;
    liveTaHistory.push({
      asOfDate: liveDateLabel,
      normDate: normalizeDate(todayStr),
      subject: st.subject,
      taId: st.taId,
      taName: st.taName,
      numStudents: st.numStudents,
      kpi1Pct: kpi1,
      kpi2Pct: kpi2,
      kpi1Met: kpi1 <= 35.0,
      kpi2Met: kpi2 >= 40.0,
      rank: 1
    });
  }

  const liveSubjectsList = Array.from(new Set(liveTaHistory.map(r => r.subject)));
  for (const sub of liveSubjectsList) {
    const subTas = liveTaHistory.filter(r => r.subject === sub);
    subTas.sort((a, b) => b.kpi2Pct - a.kpi2Pct);
    subTas.forEach((t, index) => { t.rank = index + 1; });
  }

  // 6. Merge Live Real-Time Data + Master Historical Snapshots
  const allTaHistory = [...liveTaHistory, ...masterTaHistory];

  let historicalStudents = [...dashStudents, ...masterStudentHistory];
  const allStudentHistory = [...liveStudents, ...historicalStudents];

  const subjects = ['WEBDEV', 'MERN', 'ICP'];
  const rawMasterDates = Array.from(new Set(masterTaHistory.map(r => r.asOfDate)));
  rawMasterDates.sort((a, b) => normalizeDate(b).localeCompare(normalizeDate(a)));
  
  const dates = [liveDateLabel, ...rawMasterDates];

  // 7. Build Complete TA Directory per Subject
  const taList = {};
  for (const sub of subjects) {
    const subjectTas = allTaHistory.filter(r => r.subject.toUpperCase() === sub);
    const uniqueMap = new Map();
    for (const ta of subjectTas) {
      const cleanTaId = ta.taId.replace(/\s+/g, '');
      if (!uniqueMap.has(cleanTaId)) {
        uniqueMap.set(cleanTaId, {
          taId: ta.taId,
          cleanTaId: cleanTaId,
          taName: ta.taName || ta.taId
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

  console.log(`[SheetsFetcher] Fully dynamic live real-time ingestion finished! ${liveStudents.length} LIVE student records generated across ${liveTaHistory.length} TAs.`);
  return cache;
}

export function getCache() {
  return cache;
}

// Auto-refresh every 5 minutes from Google Sheets
setInterval(() => {
  refreshData().catch(err => console.error('[SheetsFetcher] Auto-refresh failed:', err));
}, 5 * 60 * 1000);
