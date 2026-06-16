#!/usr/bin/env node
// lint-contracts — coherence checks for the PACE-method structured contracts.
//
// Zero dependency (Node built-ins only). Run from anywhere:
//   node tools/lint-contracts.mjs
// Exit code 0 = no errors (warnings allowed); 1 = at least one error.
//
// Level-1 testing (see docs/04_evaluation.md): validates the CSV decision tables,
// the sample profile, and the sport pack, plus cross-integrity between them — without
// any LLM. Required contract files missing => error; deferred/optional files missing
// => skipped with a notice (so it stays green before the knowledge_base is published).

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const P = (...s) => join(ROOT, ...s);

let errors = 0;
let warnings = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const err = (m) => { console.log(`  ✗ ${m}`); errors++; };
const warn = (m) => { console.log(`  ⚠ ${m}`); warnings++; };
const skip = (m) => console.log(`  ⊘ ${m} (skipped)`);
const head = (m) => console.log(`\n${m}`);

// --- RFC4180-ish CSV parser (quote-aware: handles "..." and "") ---------------
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') { inQuotes = true; }
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else { field += c; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // drop trailing fully-empty rows (e.g. final newline)
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}

function readText(rel) {
  const p = P(rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

// --- CSV contract check: header + constant column count -----------------------
function checkCsv(rel, expectedHeader) {
  const text = readText(rel);
  if (text === null) { err(`${rel}: required file missing`); return null; }
  const rows = parseCsv(text);
  if (rows.length === 0) { err(`${rel}: empty`); return null; }
  const header = rows[0];
  if (header.join(',') !== expectedHeader) {
    err(`${rel}: header mismatch\n      expected: ${expectedHeader}\n      got:      ${header.join(',')}`);
    return null;
  }
  const n = header.length;
  let bad = 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== n) { bad++; err(`${rel}: row ${i + 1} has ${rows[i].length} fields, expected ${n}`); }
  }
  if (bad === 0) ok(`${rel}: header + ${rows.length - 1} rows, ${n} columns each`);
  // return rows as objects keyed by header
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j]])));
}

function readJson(rel, required) {
  const text = readText(rel);
  if (text === null) {
    if (required) err(`${rel}: required file missing`); else skip(`${rel}: optional file absent`);
    return null;
  }
  try { return JSON.parse(text); }
  catch (e) { err(`${rel}: invalid JSON — ${e.message}`); return null; }
}

const CANONICAL_PHASES = ['base', 'build', 'taper', 'race', 'recovery'];

// === 1. CSV decision tables ===================================================
head('CSV decision tables');
const periodization = checkCsv(
  'src/pace-planner/assets/periodization-rules.csv',
  'phase,allowed_intensity,forbidden,volume_modifier');
const adjustments = checkCsv(
  'src/pace-coach/assets/adjustment-decisions.csv',
  'signal,recommended_action,severity');
const signals = checkCsv(
  'src/pace/signals.csv',
  'signal,threshold,proposal');
checkCsv(
  'src/pace-elicitation/methods.csv',
  'num,category,name,description,when_to_use');

// === 2. periodization phases == canonical set =================================
head('Periodization phases');
if (periodization) {
  const phases = periodization.map((r) => r.phase);
  const set = new Set(phases);
  const missing = CANONICAL_PHASES.filter((p) => !set.has(p));
  const extra = phases.filter((p) => !CANONICAL_PHASES.includes(p));
  if (missing.length) err(`periodization-rules.csv: missing phase(s): ${missing.join(', ')}`);
  if (extra.length) err(`periodization-rules.csv: unexpected phase(s): ${extra.join(', ')}`);
  if (!missing.length && !extra.length) ok(`phases == {${CANONICAL_PHASES.join(', ')}}`);
}

// === 3. adjustment severity vocabulary ========================================
head('Adjustment severities');
if (adjustments) {
  const allowed = new Set(['low', 'medium', 'high']);
  const bad = adjustments.filter((r) => !allowed.has(r.severity));
  if (bad.length) bad.forEach((r) => err(`adjustment-decisions.csv: severity '${r.severity}' for signal '${r.signal}' not in {low,medium,high}`));
  else ok(`all severities ∈ {low, medium, high}`);
}

// === 4. sample.json (frozen schema v1.0: multi-discipline) ====================
head('Sample athlete profile');
const sample = readJson('athlete/sample.json', true);
let samplePhase = null;
if (sample) {
  const need = ['schema_version', 'athlete_id', 'sports', 'current_phase', 'fitness', 'constraints', 'learned_behaviors'];
  const miss = need.filter((k) => !(k in sample));
  if (miss.length) err(`sample.json: missing key(s): ${miss.join(', ')}`);
  if (!Array.isArray(sample.sports) || sample.sports.length === 0) err(`sample.json: sports must be a non-empty array`);
  // fitness is keyed by discipline; every declared sport needs a fitness block
  if (sample.sports && Array.isArray(sample.sports) && sample.fitness) {
    const missingDisc = sample.sports.filter((s) => !(s in sample.fitness));
    if (missingDisc.length) err(`sample.json: fitness missing block(s) for declared sport(s): ${missingDisc.join(', ')}`);
  }
  if (sample.fitness && typeof sample.fitness === 'object' && 'fitness_marker' in sample.fitness)
    err(`sample.json: fitness must be keyed by discipline (fitness.<sport>), not a flat marker block`);
  if (!Array.isArray(sample.constraints)) err(`sample.json: constraints must be an array`);
  if (!Array.isArray(sample.learned_behaviors)) err(`sample.json: learned_behaviors must be an array`);
  else {
    const noId = sample.learned_behaviors.filter((b) => !b || !b.id);
    if (noId.length) err(`sample.json: ${noId.length} learned_behavior(s) without an id`);
  }
  if (!miss.length) ok(`sample.json: required keys present, ${sample.sports?.length ?? 0} sport(s), ${sample.learned_behaviors?.length ?? 0} learned_behaviors`);
  samplePhase = sample.current_phase ?? null;
}

// === 5. cycling.json vs sport schema (optional / deferred) ====================
head('Sport pack (cycling.json)');
const cycling = readJson('knowledge_base/sports/cycling.json', false);
if (cycling) {
  const need = ['sport_id', 'version', 'primary_metric', 'fitness_marker', 'intensity_zones', 'key_sessions', 'periodization'];
  const miss = need.filter((k) => !(k in cycling));
  if (miss.length) err(`cycling.json: missing field(s): ${miss.join(', ')}`);
  // zones ordered by id and contiguous
  const zones = cycling.intensity_zones?.zones;
  if (!Array.isArray(zones) || zones.length === 0) err(`cycling.json: intensity_zones.zones missing/empty`);
  else {
    let ordered = true, contiguous = true;
    for (let i = 0; i < zones.length; i++) {
      if (zones[i].id !== i + 1) ordered = false;
      const pct = zones[i].ftp_pct;
      if (!Array.isArray(pct) || pct.length !== 2) { contiguous = false; continue; }
      if (i > 0) {
        const prevHi = zones[i - 1].ftp_pct?.[1];
        // contiguous: this zone's low picks up ~ just above previous high
        if (typeof prevHi === 'number' && Math.abs(pct[0] - prevHi) > 0.02) contiguous = false;
      }
    }
    if (!ordered) err(`cycling.json: zones not ordered by id (1..n)`);
    else if (!contiguous) err(`cycling.json: zones not contiguous over the ftp_pct range`);
    else ok(`cycling.json: ${zones.length} zones, ordered & contiguous`);
  }
  // hr_zones present & ordered (schema now requires the transversal HR system)
  const hz = cycling.intensity_zones?.hr_zones;
  if (!Array.isArray(hz) || hz.length === 0) err(`cycling.json: intensity_zones.hr_zones missing/empty (schema requires it)`);
  else {
    let ord = true;
    for (let i = 0; i < hz.length; i++) if (hz[i].id !== i + 1) ord = false;
    if (!ord) err(`cycling.json: hr_zones not ordered by id (1..n)`);
    else ok(`cycling.json: ${hz.length} hr_zones, ordered`);
  }
  // >=1 active-recovery key_session (schema requires it; reference id recovery_ride)
  const ks = cycling.key_sessions || {};
  const hasRecovery = Object.entries(ks).some(([id, v]) =>
    /recovery/i.test(id) || /\bZ1\b/.test(v?.intensity || '') || /recovery/i.test(v?.purpose || ''));
  if (!hasRecovery) err(`cycling.json: no active-recovery key_session (schema requires >=1, e.g. recovery_ride)`);
  else ok(`cycling.json: active-recovery key_session present`);
  if (!miss.length && Array.isArray(zones)) ok(`cycling.json: required fields present`);
}

// === 6. cross-integrity (warnings) ============================================
head('Cross-integrity (warnings)');
// 6a. sample phase ∈ periodization phases
if (samplePhase && periodization) {
  const set = new Set(periodization.map((r) => r.phase));
  if (set.has(samplePhase)) ok(`sample.json current_phase '${samplePhase}' ∈ periodization phases`);
  else warn(`sample.json current_phase '${samplePhase}' not in periodization phases`);
}
// 6b. scenario 02 dependency: learned_behavior no_back_to_back_hard present
if (sample && Array.isArray(sample.learned_behaviors)) {
  const ids = new Set(sample.learned_behaviors.map((b) => b.id));
  if (ids.has('no_back_to_back_hard')) ok(`learned_behavior 'no_back_to_back_hard' present (scenario 02 dependency)`);
  else warn(`learned_behavior 'no_back_to_back_hard' missing — scenario 02 cannot be seeded`);
}
// 6c. best-effort: signals referenced in scenarios should be defined somewhere
if (adjustments && signals) {
  const known = new Set([
    ...adjustments.map((r) => r.signal),
    ...signals.map((r) => r.signal),
  ]);
  const scenarioFiles = [
    '01_overload_constraints', '02_memory_persistence', '03_profile_contradiction',
    '04_taper_override', '05_degraded_input', '06_routing',
  ].map((n) => `scenarios/${n}.md`);
  const unknownRefs = new Set();
  for (const f of scenarioFiles) {
    const t = readText(f);
    if (!t) continue;
    // backtick tokens that look like a signal id AND map a signal->action/proposal line
    const matches = t.match(/`([a-z][a-z0-9_]+)`/g) || [];
    for (const m of matches) {
      const tok = m.slice(1, -1);
      // only consider tokens that appear as "signal -> action" style references
      const re = new RegExp('`' + tok + '`\\s*(?:->|=>|->)');
      if (re.test(t) && !known.has(tok)) unknownRefs.add(`${tok} (in ${f})`);
    }
  }
  if (unknownRefs.size) [...unknownRefs].forEach((r) => warn(`scenario references undefined signal: ${r}`));
  else ok(`scenario signal references resolve to a CSV signal`);
}

// === 7. derived zones fixture (sample-zones.json — frozen schema v1.0) ========
head('Derived zones (sample-zones.json)');
const zonesFx = readJson('athlete/sample-zones.json', false);
if (zonesFx) {
  const need = ['schema_version', 'generated_by', 'generated_at', 'by_discipline'];
  const miss = need.filter((k) => !(k in zonesFx));
  if (miss.length) err(`sample-zones.json: missing field(s): ${miss.join(', ')}`);
  else ok(`sample-zones.json: required fields present (generated_by ${zonesFx.generated_by})`);
  const byDisc = zonesFx.by_discipline;
  if (byDisc && typeof byDisc === 'object') {
    for (const [disc, block] of Object.entries(byDisc)) {
      // each zone system, if present, ordered by id 1..n
      for (const key of ['power_zones', 'hr_zones', 'pace_zones']) {
        const arr = block?.[key];
        if (!Array.isArray(arr)) continue;
        let ordered = true;
        for (let i = 0; i < arr.length; i++) if (arr[i].id !== i + 1) ordered = false;
        if (!ordered) err(`sample-zones.json: by_discipline.${disc}.${key} not ordered by id (1..n)`);
        else ok(`sample-zones.json: ${disc}.${key} present, ${arr.length} zones, ordered`);
      }
      // coherence gate (per discipline): zones.by_discipline.<d>.fitness_markers === profile.fitness.<d>
      const profMarkers = sample?.fitness?.[disc];
      if (profMarkers && block?.fitness_markers) {
        let coherent = true;
        for (const [k, v] of Object.entries(block.fitness_markers)) {
          if (profMarkers[k] !== v) {
            coherent = false;
            err(`sample-zones.json: by_discipline.${disc}.fitness_markers.${k}=${JSON.stringify(v)} != sample.json.fitness.${disc}.${k}=${JSON.stringify(profMarkers[k])} (stale zones — pace-validate would reject)`);
          }
        }
        if (coherent) ok(`sample-zones.json: ${disc} fitness_markers coherent with sample.json.fitness.${disc} (pace-validate gate)`);
      } else if (!profMarkers) {
        warn(`sample-zones.json: by_discipline.${disc} has no matching profile.fitness.${disc} block`);
      }
    }
  }
}

// === 8. week-example.json (frozen week schema v1.0 + summary recompute) =======
head('Week fixture (week-example.json)');
const week = readJson('src/pace-planner/assets/week-example.json', false);
if (week) {
  if (week.schema_version !== '1.0') err(`week-example.json: schema_version must be "1.0"`);
  const sessions = Array.isArray(week.sessions) ? week.sessions : [];
  const ids = new Set();
  let shapeOk = true;
  for (const s of sessions) {
    if (!s.id || !s.date || !s.slot || !s.sport || !s.type) { shapeOk = false; err(`week-example.json: session missing id/date/slot/sport/type (${s.id || s.date})`); }
    if (s.id && s.id !== `${s.date}-${s.slot}`) { shapeOk = false; err(`week-example.json: session id '${s.id}' != '<date>-<slot>' (${s.date}-${s.slot})`); }
    if (s.id) { if (ids.has(s.id)) err(`week-example.json: duplicate session id '${s.id}'`); ids.add(s.id); }
    const t = s.planned?.target;
    if (!t || !['power', 'hr', 'pace'].includes(t.metric) || !t.range) { shapeOk = false; err(`week-example.json: session '${s.id}' planned.target must be {metric∈power|hr|pace, zone_ref, range}`); }
  }
  if (shapeOk && sessions.length) ok(`week-example.json: ${sessions.length} sessions, ids unique & well-formed, targets metric-tagged`);

  // recompute the summary and compare to the stored block (the scenario-13 gate)
  const sm = week.summary;
  if (sm) {
    const exec = sessions.filter((s) => s.status === 'done' || s.status === 'adjusted');
    const by = (st) => sessions.filter((s) => s.status === st).length;
    const counts = { total: sessions.length, done: by('done'), adjusted: by('adjusted'), skipped: by('skipped'), pending: by('planned') };
    const durActual = exec.reduce((a, s) => a + (s.actual?.duration_min_actual || 0), 0);
    const durPlanned = sessions.reduce((a, s) => a + (s.planned?.duration_min || 0), 0);
    const distBySport = {};
    for (const s of exec) if (typeof s.actual?.distance_km === 'number') distBySport[s.sport] = +( (distBySport[s.sport] || 0) + s.actual.distance_km ).toFixed(2);
    const term = counts.done + counts.adjusted + counts.skipped;
    const adherence = term ? +((counts.done + counts.adjusted) / term).toFixed(4) : null;
    const sports = new Set(sessions.map((s) => s.sport));

    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    let smOk = true;
    if (!eq(sm.sessions, counts)) { smOk = false; err(`week-example.json: summary.sessions ${JSON.stringify(sm.sessions)} != recomputed ${JSON.stringify(counts)}`); }
    if (sm.duration_min?.actual !== durActual || sm.duration_min?.planned !== durPlanned) { smOk = false; err(`week-example.json: summary.duration_min != {planned:${durPlanned}, actual:${durActual}}`); }
    if (!eq(sm.distance_km, distBySport)) { smOk = false; err(`week-example.json: summary.distance_km ${JSON.stringify(sm.distance_km)} != recomputed-by-sport ${JSON.stringify(distBySport)}`); }
    if (Math.abs((sm.adherence ?? -1) - (adherence ?? -1)) > 1e-9) { smOk = false; err(`week-example.json: summary.adherence ${sm.adherence} != recomputed ${adherence}`); }
    // by_sport present iff >1 sport
    if (sports.size > 1 && !sm.by_sport) { smOk = false; err(`week-example.json: week spans ${sports.size} sports but summary.by_sport is absent`); }
    if (sports.size <= 1 && sm.by_sport) { smOk = false; err(`week-example.json: mono-sport week must omit summary.by_sport`); }
    if (smOk) ok(`week-example.json: summary recompute matches (counts, durations, distance-by-sport, adherence, by_sport rule)`);
  }
}

// === report ===================================================================
head('Result');
console.log(`  ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
