import { useState, useEffect } from "react";


// === CONSTANTS ===
const DEFAULT_SECTIONS = [
  { id: "knowledge_check", label: "Knowledge Check / Quiz", defaultHours: 1.5 },
  { id: "scenario", label: "Scenario / Branching", defaultHours: 4 },
  { id: "text_graphic", label: "Text + Graphic Slide", defaultHours: 0.5 },
  { id: "video_lesson", label: "Video Lesson (scripted)", defaultHours: 3 },
  { id: "interactive", label: "Interactive Exercise", defaultHours: 5 },
  { id: "job_aid", label: "Job Aid / Reference Page", defaultHours: 1 },
];

const COMPLEXITY = {
  low: { label: "Low — client provides polished content", multiplier: 0.8 },
  medium: { label: "Medium — some content development needed", multiplier: 1.0 },
  high: { label: "High — heavy content dev / SME coordination", multiplier: 1.4 },
};

const REVISION_ROUNDS = { 1: 0.1, 2: 0.2, 3: 0.3 };

// === STORAGE HELPERS (localStorage) ===
const STORAGE_PREFIX = "id_est_";

async function saveEstimate(estimate) {
  const id = `${STORAGE_PREFIX}${Date.now()}`;
  localStorage.setItem(id, JSON.stringify({ ...estimate, id, savedAt: new Date().toISOString() }));
  return id;
}

async function loadAllEstimates() {
  try {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const val = localStorage.getItem(key);
          if (val) items.push(JSON.parse(val));
        } catch { /* skip */ }
      }
    }
    return items.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  } catch { return []; }
}

async function deleteEstimate(id) {
  localStorage.removeItem(id);
}

// === STYLES ===
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0c0a09; }
.fade-in { animation: fadeIn 0.35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
.pill { display: inline-block; background: #1c1917; border: 1px solid #3d3530; border-radius: 999px; padding: 1px 9px; font-size: 11px; font-family: 'DM Mono', monospace; color: #a8a29e; }
.seg-btn { flex: 1; padding: 7px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid #44403c; background: transparent; color: #78716c; cursor: pointer; transition: all 0.12s; font-family: 'DM Sans', sans-serif; }
.seg-btn:first-child { border-radius: 7px 0 0 7px; }
.seg-btn:last-child { border-radius: 0 7px 7px 0; }
.seg-btn:not(:first-child) { border-left: none; }
.seg-btn.active { background: #f59e0b; border-color: #f59e0b; color: #1c1917; }
.seg-btn:hover:not(.active) { color: #d6d3d1; border-color: #57534e; }
.row-num { width: 54px; background: #1c1917; border: 1px solid #3d3530; border-radius: 6px; padding: 5px 7px; text-align: center; font-family: 'DM Mono', monospace; font-size: 13px; color: #f5f5f4; }
.row-num:focus { outline: none; border-color: #f59e0b; }
.hours-input { width: 54px; background: #1c1917; border: 1px solid #3d3530; border-radius: 6px; padding: 5px 7px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12px; color: #f59e0b; }
.hours-input:focus { outline: none; border-color: #f59e0b; }
.card { background: #161210; border: 1px solid #292524; border-radius: 12px; padding: 20px; margin-bottom: 10px; }
.big-num { font-family: 'DM Mono', monospace; font-size: 26px; font-weight: 500; color: #f59e0b; }
.line-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #1c1917; font-size: 13px; }
.line-item:last-child { border-bottom: none; }
.mono { font-family: 'DM Mono', monospace; }
.nav-tab { padding: 7px 14px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; border: none; background: transparent; cursor: pointer; color: #57534e; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.nav-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
.nav-tab:hover:not(.active) { color: #a8a29e; }
.est-history-item { background: #161210; border: 1px solid #292524; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: border-color 0.15s; }
.est-history-item:hover { border-color: #57534e; }
.btn-primary { width: 100%; padding: 11px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.04em; border: none; cursor: pointer; transition: all 0.15s; background: #f59e0b; color: #1c1917; font-family: 'DM Sans', sans-serif; }
.btn-primary:hover { background: #fbbf24; }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-ghost { padding: 7px 14px; border-radius: 7px; font-size: 12px; border: 1px solid #3d3530; background: transparent; color: #78716c; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.btn-ghost:hover { color: #d6d3d1; border-color: #57534e; }
.btn-export { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 7px; font-size: 12px; font-weight: 500; border: 1px solid #3d3530; background: #161210; color: #a8a29e; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
.btn-export:hover { color: #f5f5f4; border-color: #78716c; background: #1c1917; }
.btn-export.success { border-color: #22c55e; color: #22c55e; }
.input-field { width: 100%; background: #161210; border: 1px solid #3d3530; border-radius: 8px; padding: 9px 12px; color: #f5f5f4; font-size: 13px; font-family: 'DM Sans', sans-serif; transition: border-color 0.15s; }
.input-field:focus { outline: none; border-color: #f59e0b; }
.input-field::placeholder { color: #44403c; }
.label { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #57534e; margin-bottom: 7px; }
.section-divider { border: none; border-top: 1px solid #1c1917; margin: 18px 0; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1c1917; border: 1px solid #3d3530; border-radius: 8px; padding: 10px 18px; font-size: 13px; color: #d6d3d1; z-index: 100; animation: toastIn 0.2s ease; font-family: 'DM Sans', sans-serif; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

// === FORM COMPONENT ===
function IntakeForm({ onEstimate, initialData }) {
  const blankSections = () =>
    DEFAULT_SECTIONS.map((s) => ({ ...s, count: 0, hoursPerUnit: s.defaultHours }));

  const [form, setForm] = useState(() => initialData || {
    clientName: "", projectName: "", description: "",
    tool: "Rise 360", complexity: "medium", revisionRounds: 2,
    hourlyRate: "", includeProjectMgmt: true, sections: blankSections(),
  });

  const updateSection = (id, field, value) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === id ? { ...s, [field]: Math.max(0, parseFloat(value) || 0) } : s
      ),
    }));
  };

  const totalBaseHours = form.sections.reduce((sum, s) => sum + s.count * s.hoursPerUnit, 0);
  const canSubmit = form.clientName.trim() && form.projectName.trim() && form.hourlyRate && totalBaseHours > 0;

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Client info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div>
          <label className="label">Client Name</label>
          <input className="input-field" placeholder="e.g. Amwell" value={form.clientName}
            onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
        </div>
        <div>
          <label className="label">Project Name</label>
          <input className="input-field" placeholder="e.g. Onboarding Module" value={form.projectName}
            onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label className="label">Brief Description</label>
        <textarea className="input-field" rows={2} style={{ resize: "none" }}
          placeholder="What is this project about?"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <hr className="section-divider" />

      {/* Tool */}
      <div style={{ marginBottom: 18 }}>
        <label className="label">Authoring Tool</label>
        <div style={{ display: "flex" }}>
          {["Rise 360", "Storyline 360", "Both / Other"].map(t => (
            <button key={t} className={`seg-btn ${form.tool === t ? "active" : ""}`}
              onClick={() => setForm(f => ({ ...f, tool: t }))}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <label className="label" style={{ margin: 0 }}>Content Units</label>
          <span style={{ fontSize: 10, color: "#57534e", fontFamily: "'DM Mono', monospace" }}>
            COUNT &nbsp;&nbsp; HRS/UNIT
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {form.sections.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min={0} className="row-num" value={s.count || ""}
                placeholder="0"
                onChange={e => updateSection(s.id, "count", e.target.value)} />
              <span style={{ flex: 1, fontSize: 13, color: "#a8a29e" }}>{s.label}</span>
              <input type="number" min={0.25} step={0.25} className="hours-input"
                value={s.hoursPerUnit}
                onChange={e => updateSection(s.id, "hoursPerUnit", e.target.value)} />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#44403c", marginTop: 8 }}>
          Amber fields = hours per unit — edit to match your pace.
        </p>
      </div>

      <hr className="section-divider" />

      {/* Complexity */}
      <div style={{ marginBottom: 18 }}>
        <label className="label">Project Complexity</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(COMPLEXITY).map(([key, val]) => (
            <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <div style={{
                marginTop: 2, width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: form.complexity === key ? "2px solid #f59e0b" : "2px solid #3d3530",
                background: form.complexity === key ? "#f59e0b" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s"
              }} onClick={() => setForm(f => ({ ...f, complexity: key }))}>
                {form.complexity === key && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1c1917" }} />}
              </div>
              <span style={{ fontSize: 13, color: "#a8a29e" }}>{val.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Revisions + PM */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div>
          <label className="label">Revision Rounds</label>
          <div style={{ display: "flex" }}>
            {[1, 2, 3].map(n => (
              <button key={n} className={`seg-btn ${form.revisionRounds === n ? "active" : ""}`}
                onClick={() => setForm(f => ({ ...f, revisionRounds: n }))}>{n}R</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Hourly Rate (USD)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#57534e", fontSize: 13 }}>$</span>
            <input className="input-field" type="number" placeholder="75"
              style={{ paddingLeft: 22 }}
              value={form.hourlyRate}
              onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 38, height: 20, borderRadius: 999, cursor: "pointer", transition: "background 0.15s",
          background: form.includeProjectMgmt ? "#f59e0b" : "#292524", position: "relative", flexShrink: 0
        }} onClick={() => setForm(f => ({ ...f, includeProjectMgmt: !f.includeProjectMgmt }))}>
          <div style={{
            position: "absolute", top: 2, width: 16, height: 16, background: "white", borderRadius: "50%",
            transition: "transform 0.15s", transform: form.includeProjectMgmt ? "translateX(20px)" : "translateX(2px)"
          }} />
        </div>
        <span style={{ fontSize: 13, color: "#a8a29e" }}>Include project management buffer (15%)</span>
      </div>

      <button className="btn-primary" disabled={!canSubmit}
        onClick={() => onEstimate(form)}>
        Generate Estimate →
      </button>
    </div>
  );
}

// === CALC HELPER ===
function calcEstimate(form) {
  const totalBaseHours = form.sections.reduce((sum, s) => sum + s.count * s.hoursPerUnit, 0);
  const complexityMultiplier = COMPLEXITY[form.complexity].multiplier;
  const revisionBuffer = REVISION_ROUNDS[form.revisionRounds] || 0.2;
  const designHours = totalBaseHours * complexityMultiplier;
  const revisionHours = designHours * revisionBuffer;
  const pmHours = form.includeProjectMgmt ? (designHours + revisionHours) * 0.15 : 0;
  const totalHours = designHours + revisionHours + pmHours;
  const rate = parseFloat(form.hourlyRate) || 0;
  const totalCost = totalHours * rate;
  const weeksEstimate = Math.max(1, Math.ceil(totalHours / 20));
  return { totalBaseHours, designHours, revisionHours, pmHours, totalHours, totalCost, weeksEstimate, rate };
}

function buildCopyText(form, calc) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const activeUnits = form.sections.filter(s => s.count > 0);
  return `PROJECT ESTIMATE — ${date}
${"=".repeat(40)}
Client: ${form.clientName}
Project: ${form.projectName}
Tool: ${form.tool}
${form.description ? `Description: ${form.description}\n` : ""}
SCOPE SUMMARY
${"-".repeat(30)}
Complexity: ${form.complexity.charAt(0).toUpperCase() + form.complexity.slice(1)} (${COMPLEXITY[form.complexity].multiplier}×)
Revision rounds: ${form.revisionRounds}
PM buffer: ${form.includeProjectMgmt ? "Yes (15%)" : "No"}

CONTENT UNITS
${"-".repeat(30)}
${activeUnits.map(s => `${s.label}: ${s.count} × ${s.hoursPerUnit}h = ${(s.count * s.hoursPerUnit).toFixed(1)}h`).join("\n")}

HOURS BREAKDOWN
${"-".repeat(30)}
Base design hours:    ${calc.designHours.toFixed(1)}h
Revisions (${form.revisionRounds}R):     ${calc.revisionHours.toFixed(1)}h
${form.includeProjectMgmt ? `Project management:   ${calc.pmHours.toFixed(1)}h\n` : ""}Total hours:          ${calc.totalHours.toFixed(1)}h
Rate:                 $${form.hourlyRate}/hr
Estimated cost:       $${calc.totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
Timeline:             ~${calc.weeksEstimate} week${calc.weeksEstimate > 1 ? "s" : ""}
${"=".repeat(40)}
Note: This is a preliminary estimate based on stated scope. Final pricing subject to discovery.`;
}

// === ESTIMATE VIEW ===
function EstimateView({ form, onEdit, onSave, saved }) {
  const calc = calcEstimate(form);
  const [copyState, setCopyState] = useState("idle");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    const text = buildCopyText(form, calc);
    await navigator.clipboard.writeText(text);
    setCopyState("success");
    showToast("Copied to clipboard");
    setTimeout(() => setCopyState("idle"), 2000);
  };

  const handlePrint = () => {
    const text = buildCopyText(form, calc);
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${form.clientName} — ${form.projectName}</title>
    <style>body{font-family:monospace;font-size:13px;padding:40px;white-space:pre-wrap;line-height:1.6;color:#111;}</style>
    </head><body>${text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleSave = async () => {
    await onSave(form);
    showToast("Estimate saved");
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{form.clientName}</p>
          <h2 style={{ fontSize: 18, fontWeight: 300, letterSpacing: "-0.01em", color: "#f5f5f4" }}>{form.projectName}</h2>
        </div>
        <button className="btn-ghost" onClick={onEdit}>← Edit</button>
      </div>

      {/* Top numbers */}
      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          {[
            { val: `${calc.totalHours.toFixed(1)}`, label: "Total Hours" },
            { val: `$${calc.totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, label: "Est. Cost" },
            { val: `${calc.weeksEstimate}w`, label: "Timeline" },
          ].map(item => (
            <div key={item.label}>
              <div className="big-num">{item.val}</div>
              <div style={{ fontSize: 10, color: "#57534e", marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hours breakdown */}
      <div className="card">
        <p className="label">Hours Breakdown</p>
        {[
          { label: "Base design hours", val: `${calc.designHours.toFixed(1)}h` },
          { label: `Revisions (${form.revisionRounds} round${form.revisionRounds > 1 ? "s" : ""})`, val: `${calc.revisionHours.toFixed(1)}h` },
          ...(form.includeProjectMgmt ? [{ label: "Project management (15%)", val: `${calc.pmHours.toFixed(1)}h` }] : []),
        ].map(row => (
          <div key={row.label} className="line-item">
            <span style={{ color: "#78716c", fontSize: 13 }}>{row.label}</span>
            <span className="mono" style={{ color: "#d6d3d1", fontSize: 13 }}>{row.val}</span>
          </div>
        ))}
        <div className="line-item" style={{ paddingTop: 10 }}>
          <span style={{ color: "#f5f5f4", fontSize: 13, fontWeight: 600 }}>Total</span>
          <span className="mono" style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>{calc.totalHours.toFixed(1)}h @ ${form.hourlyRate}/hr</span>
        </div>
      </div>

      {/* Content units */}
      <div className="card">
        <p className="label">Content Units</p>
        {form.sections.filter(s => s.count > 0).map(s => (
          <div key={s.id} className="line-item">
            <span style={{ color: "#78716c", fontSize: 13 }}>{s.label}</span>
            <span className="mono" style={{ color: "#a8a29e", fontSize: 12 }}>{s.count} × {s.hoursPerUnit}h = {(s.count * s.hoursPerUnit).toFixed(1)}h</span>
          </div>
        ))}
        <div className="line-item">
          <span style={{ fontSize: 11, color: "#44403c" }}>Complexity multiplier</span>
          <span className="pill">{COMPLEXITY[form.complexity].multiplier}× {form.complexity}</span>
        </div>
      </div>

      {/* Project info */}
      <div className="card">
        <p className="label">Project Info</p>
        <div className="line-item">
          <span style={{ color: "#78716c", fontSize: 13 }}>Tool</span>
          <span style={{ color: "#d6d3d1", fontSize: 13 }}>{form.tool}</span>
        </div>
        {form.description && (
          <p style={{ marginTop: 10, fontSize: 13, color: "#57534e", fontStyle: "italic" }}>"{form.description}"</p>
        )}
      </div>

      {/* Export actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <button className={`btn-export ${copyState === "success" ? "success" : ""}`} onClick={handleCopy}>
          <span>{copyState === "success" ? "✓" : "⎘"}</span>
          {copyState === "success" ? "Copied!" : "Copy Text"}
        </button>
        <button className="btn-export" onClick={handlePrint}>
          <span>⎙</span> Export / Print
        </button>
        {!saved && (
          <button className="btn-export" onClick={handleSave}>
            <span>↓</span> Save Estimate
          </button>
        )}
        {saved && (
          <span style={{ fontSize: 12, color: "#22c55e", alignSelf: "center", fontFamily: "'DM Mono', monospace" }}>✓ saved</span>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// === HISTORY VIEW ===
function HistoryView({ estimates, onLoad, onDelete }) {
  if (estimates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#44403c" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>○</div>
        <p style={{ fontSize: 13 }}>No saved estimates yet.</p>
        <p style={{ fontSize: 12, marginTop: 6 }}>Save an estimate from the results view to build your history.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 40 }}>
      {estimates.map(est => {
        const calc = calcEstimate(est);
        const date = new Date(est.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return (
          <div key={est.id} className="est-history-item" onClick={() => onLoad(est)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 10, color: "#57534e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{est.clientName}</p>
                <p style={{ fontSize: 14, color: "#d6d3d1", fontWeight: 400 }}>{est.projectName}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="mono" style={{ fontSize: 15, color: "#f59e0b" }}>${calc.totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                <p style={{ fontSize: 11, color: "#44403c", marginTop: 2 }}>{calc.totalHours.toFixed(1)}h · {calc.weeksEstimate}w</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span className="pill">{est.tool}</span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#44403c" }}>{date}</span>
                <button style={{ fontSize: 11, color: "#44403c", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  onClick={e => { e.stopPropagation(); onDelete(est.id); }}>✕</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// === MAIN APP ===
function App() {
  const [tab, setTab] = useState("new"); // new | result | history
  const [currentForm, setCurrentForm] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadAllEstimates().then(ests => {
      setEstimates(ests);
      setLoaded(true);
    });
  }, []);

  const handleEstimate = (form) => {
    setCurrentForm(form);
    setSavedId(null);
    setTab("result");
  };

  const handleSave = async (form) => {
    const id = await saveEstimate(form);
    setSavedId(id);
    const updated = await loadAllEstimates();
    setEstimates(updated);
  };

  const handleDelete = async (id) => {
    await deleteEstimate(id);
    const updated = await loadAllEstimates();
    setEstimates(updated);
  };

  const handleLoadFromHistory = (est) => {
    setCurrentForm(est);
    setSavedId(est.id);
    setTab("result");
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0c0a09", color: "#f5f5f4", padding: "28px 20px 0" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 5 }}>Freelance ID</p>
            <h1 style={{ fontSize: 24, fontWeight: 300, letterSpacing: "-0.02em", color: "#f5f5f4" }}>Project Intake &amp; Estimator</h1>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", borderBottom: "1px solid #1c1917", marginBottom: 24 }}>
            <button className={`nav-tab ${tab === "new" || tab === "result" ? "active" : ""}`}
              onClick={() => setTab(currentForm && tab === "result" ? "result" : "new")}>
              {tab === "result" ? "Estimate" : "New Estimate"}
            </button>
            <button className={`nav-tab ${tab === "history" ? "active" : ""}`}
              onClick={() => setTab("history")}>
              History {estimates.length > 0 && <span style={{ marginLeft: 5, background: "#292524", borderRadius: 999, padding: "1px 7px", fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#78716c" }}>{estimates.length}</span>}
            </button>
          </div>

          {/* Content */}
          {tab === "new" && (
            <IntakeForm onEstimate={handleEstimate} />
          )}
          {tab === "result" && currentForm && (
            <EstimateView
              form={currentForm}
              onEdit={() => setTab("new")}
              onSave={handleSave}
              saved={!!savedId}
            />
          )}
          {tab === "history" && (
            <HistoryView
              estimates={estimates}
              onLoad={handleLoadFromHistory}
              onDelete={handleDelete}
            />
          )}

        </div>
      </div>
    </>
  );
}

export default App;
