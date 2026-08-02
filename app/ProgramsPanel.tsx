"use client";

import React, { useState } from "react";
import {
  BODY_REGIONS,
  MUSCLE_GROUPS,
  EQUIPMENT_LABELS,
  EXERCISES,
  type BodyRegion,
  type MuscleGroup,
  type Equipment,
  type Exercise,
} from "@/lib/exercises";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgramExercise {
  id: number;
  name: string;
  unit: "lbs" | "kg";
  note: string;
  sets: { id: number; weight: string; reps: string; logged: boolean }[];
}

export interface ProgramDay {
  name: string;
  workouts: ProgramExercise[];
}

export interface Program {
  id: string;
  name: string;
  weeks: number;
  days: ProgramDay[];
  createdAt: number;
}

export interface ArchivedProgram extends Program {
  archivedAt: number;
  weeksCompleted: number;
}

const DAY_OPTIONS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const primaryBtnS: React.CSSProperties = {
  background: "#450a0a",
  border: "1px solid #991b1b",
  color: "#fca5a5",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 11,
  letterSpacing: 2,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 700,
};

const iconBtnS: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#6a3a3a",
  cursor: "pointer",
  fontSize: 15,
  padding: "2px 6px",
  lineHeight: 1,
  fontFamily: "inherit",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 3,
  color: "#9f1239",
  marginBottom: 8,
  fontWeight: 700,
};

const inputS: React.CSSProperties = {
  background: "#0d0d0d",
  border: "1px solid #2a2020",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const bigOptionBtn: React.CSSProperties = {
  background: "#1a1414",
  border: "1px solid #2a1414",
  borderRadius: 10,
  padding: "14px 16px",
  color: "#fff",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  justifyContent: "flex-start",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildExercise(ex: Exercise, sets: number, reps: number, unit: "lbs" | "kg"): ProgramExercise {
  return {
    id: Math.random(),
    name: ex.name,
    unit,
    note: ex.note || "",
    sets: Array.from({ length: sets }, () => ({
      id: Math.random(),
      weight: String(ex.defaultWeight),
      reps: String(reps),
      logged: false,
    })),
  };
}

// ─── ExercisePicker ───────────────────────────────────────────────────────────

interface ExercisePickerProps {
  onAdd: (ex: ProgramExercise) => void;
  onClose: () => void;
}

function ExercisePicker({ onAdd, onClose }: ExercisePickerProps) {
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");

  function back() {
    if (selectedEx) { setSelectedEx(null); return; }
    if (equipment)  { setEquipment(null);  return; }
    if (muscle)     { setMuscle(null);     return; }
    if (region)     { setRegion(null);     return; }
    onClose();
  }

  const exercises = muscle && equipment ? EXERCISES[muscle][equipment] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px", borderBottom: "1px solid #2a2020", background: "#1a1414",
      }}>
        <button onClick={back} style={{ ...iconBtnS, fontSize: 18, color: "#9f1239" }}>←</button>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>
          {!region ? "SELECT BODY REGION"
            : !muscle ? "SELECT MUSCLE GROUP"
            : !equipment ? "SELECT EQUIPMENT"
            : !selectedEx ? `${muscle.toUpperCase()} · ${EQUIPMENT_LABELS[equipment].toUpperCase()}`
            : "CONFIGURE EXERCISE"}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {/* Step 1 — Region */}
        {!region && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BODY_REGIONS.map(r => (
              <button key={r.id} onClick={() => setRegion(r.id)} style={bigOptionBtn}>
                <span style={{ fontSize: 22 }}>{r.id === "upper" ? "💪" : "🦵"}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Muscle group */}
        {region && !muscle && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MUSCLE_GROUPS[region].map(m => (
              <button key={m.id} onClick={() => setMuscle(m.id)} style={bigOptionBtn}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — Equipment */}
        {muscle && !equipment && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(Object.keys(EQUIPMENT_LABELS) as Equipment[]).map(eq => (
              <button key={eq} onClick={() => setEquipment(eq)} style={bigOptionBtn}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{EQUIPMENT_LABELS[eq]}</span>
                <span style={{ fontSize: 10, color: "#7a4040" }}>
                  {EXERCISES[muscle][eq].length} exercises
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 4 — Exercise list */}
        {muscle && equipment && !selectedEx && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {exercises.map(ex => (
              <button key={ex.name} onClick={() => {
                setSelectedEx(ex);
                setSets(ex.defaultSets);
                setReps(ex.defaultReps);
              }} style={{
                ...bigOptionBtn,
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                padding: "10px 14px",
              }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{ex.name}</span>
                <span style={{ fontSize: 10, color: "#7a4040" }}>
                  {ex.defaultSets}×{ex.defaultReps} · {ex.defaultWeight > 0 ? `${ex.defaultWeight} lbs` : "Bodyweight"}
                  {ex.note ? ` · ${ex.note}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 5 — Configure */}
        {selectedEx && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "#1a1414", border: "1px solid #2a1414",
              borderRadius: 10, padding: "12px 14px",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{selectedEx.name}</div>
              {selectedEx.note && (
                <div style={{ fontSize: 11, color: "#7a4040", fontStyle: "italic" }}>{selectedEx.note}</div>
              )}
            </div>

            <div>
              <div style={fieldLabel}>SETS</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[1,2,3,4,5,6].map(n => (
                  <button key={n} onClick={() => setSets(n)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontFamily: "inherit",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    background: sets === n ? "#450a0a" : "#1a1414",
                    border: `1px solid ${sets === n ? "#991b1b" : "#2a1414"}`,
                    color: sets === n ? "#fca5a5" : "#555",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={fieldLabel}>REPS</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[6,8,10,12,15,20].map(n => (
                  <button key={n} onClick={() => setReps(n)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontFamily: "inherit",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    background: reps === n ? "#450a0a" : "#1a1414",
                    border: `1px solid ${reps === n ? "#991b1b" : "#2a1414"}`,
                    color: reps === n ? "#fca5a5" : "#555",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={fieldLabel}>UNIT</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["lbs", "kg"] as const).map(u => (
                  <button key={u} onClick={() => setUnit(u)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontFamily: "inherit",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    background: unit === u ? "#450a0a" : "#1a1414",
                    border: `1px solid ${unit === u ? "#991b1b" : "#2a1414"}`,
                    color: unit === u ? "#fca5a5" : "#555",
                  }}>{u}</button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                onAdd(buildExercise(selectedEx, sets, reps, unit));
                onClose();
              }}
              style={{ ...primaryBtnS, width: "100%", padding: "12px", fontSize: 13, letterSpacing: 2 }}
            >
              + ADD TO DAY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Programs Panel ──────────────────────────────────────────────────────

interface ProgramsPageProps {
  programs: Program[];
  activeProgram: Program | null;
  archivedPrograms: ArchivedProgram[];
  weeksCompleted: number;
  onSave: (program: Program) => void;
  onActivate: (program: Program) => void;
  onEndProgram: () => void;
  onEditActiveDays: (updatedProgram: Program) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function ProgramsPage({
  programs,
  activeProgram,
  archivedPrograms,
  weeksCompleted,
  onSave,
  onActivate,
  onEndProgram,
  onEditActiveDays,
  onDelete,
  onClose,
}: ProgramsPageProps) {
  const [view, setView] = useState<"list" | "builder" | "edit-active">("list");
  const [draft, setDraft] = useState<Partial<Program>>({});
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [endInput, setEndInput] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  function startNew() {
    setDraft({ id: String(Date.now()), name: "", weeks: 7, days: [], createdAt: Date.now() });
    setActiveDayIdx(0);
    setView("builder");
  }

  function startEditActive() {
    if (!activeProgram) return;
    setDraft({ ...activeProgram });
    setActiveDayIdx(0);
    setView("edit-active");
  }

  function toggleDay(dayName: string) {
    const days = draft.days || [];
    const exists = days.find(d => d.name === dayName);
    if (exists) {
      // Remove — keep remaining days in their current order
      const updated = days.filter(d => d.name !== dayName);
      setDraft(p => ({ ...p, days: updated }));
      setActiveDayIdx(i => Math.min(i, Math.max(0, updated.length - 1)));
    } else {
      // Append to end — user decides order via ↑↓ buttons
      setDraft(p => ({ ...p, days: [...(p.days || []), { name: dayName, workouts: [] }] }));
    }
  }

  function moveDay(index: number, dir: -1 | 1) {
    const days = [...(draft.days || [])];
    const target = index + dir;
    if (target < 0 || target >= days.length) return;
    [days[index], days[target]] = [days[target], days[index]];
    setDraft(p => ({ ...p, days }));
    setActiveDayIdx(target);
  }

  function addExerciseToDay(ex: ProgramExercise) {
    setDraft(p => ({
      ...p,
      days: (p.days || []).map((d, i) =>
        i === activeDayIdx ? { ...d, workouts: [...d.workouts, ex] } : d
      ),
    }));
  }

  function removeExercise(dayIdx: number, exId: number) {
    setDraft(p => ({
      ...p,
      days: (p.days || []).map((d, i) =>
        i === dayIdx ? { ...d, workouts: d.workouts.filter(w => w.id !== exId) } : d
      ),
    }));
  }

  function saveProgram() {
    if (!draft.name?.trim() || !draft.days?.length) return;
    onSave(draft as Program);
    setView("list");
  }

  function saveEditActive() {
    if (!draft.days?.length) return;
    onEditActiveDays(draft as Program);
    setView("list");
  }

  function tryEndProgram() {
    if (endInput.toLowerCase().trim() === "end program") {
      onEndProgram();
      setShowEndConfirm(false);
      setEndInput("");
    }
  }

  const currentDay = draft.days?.[activeDayIdx];
  const isEditing = view === "edit-active";

  // ── Builder / Edit-Active view ────────────────────────────────────────────────
  if (view === "builder" || view === "edit-active") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", borderBottom: "1px solid #2a2020", background: "#1a1414",
        }}>
          <button onClick={() => setView("list")} style={{ ...iconBtnS, fontSize: 18, color: "#9f1239" }}>←</button>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#fff" }}>
            {isEditing ? "EDIT ACTIVE PROGRAM" : "NEW PROGRAM"}
          </div>
        </div>

        {showPicker && currentDay ? (
          <ExercisePicker onAdd={addExerciseToDay} onClose={() => setShowPicker(false)} />
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

            {!isEditing && (
              <div style={{ marginBottom: 16 }}>
                <div style={fieldLabel}>PROGRAM NAME</div>
                <input
                  placeholder="e.g. Push Pull Legs"
                  value={draft.name || ""}
                  onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                  style={inputS}
                />
              </div>
            )}

            {!isEditing && (
              <div style={{ marginBottom: 16 }}>
                <div style={fieldLabel}>NUMBER OF WEEKS</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[4, 6, 7, 8, 10, 12].map(n => (
                    <button key={n} onClick={() => setDraft(p => ({ ...p, weeks: n }))} style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, fontFamily: "inherit",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      background: draft.weeks === n ? "#450a0a" : "#1a1414",
                      border: `1px solid ${draft.weeks === n ? "#991b1b" : "#2a1414"}`,
                      color: draft.weeks === n ? "#fca5a5" : "#555",
                    }}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={fieldLabel}>TRAINING DAYS</div>
              {/* Day picker chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {DAY_OPTIONS.map(day => {
                  const selected = (draft.days || []).some(d => d.name === day);
                  return (
                    <button key={day} onClick={() => toggleDay(day)} style={{
                      padding: "7px 12px", borderRadius: 8, fontFamily: "inherit",
                      fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: 1,
                      background: selected ? "#450a0a" : "#1a1414",
                      border: `1px solid ${selected ? "#991b1b" : "#2a1414"}`,
                      color: selected ? "#fca5a5" : "#555",
                    }}>{day.slice(0, 3).toUpperCase()}</button>
                  );
                })}
              </div>
              {/* Ordered list with ↑↓ controls */}
              {(draft.days || []).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginBottom: 2 }}>
                    DRAG ORDER — USE ARROWS TO REORDER
                  </div>
                  {(draft.days || []).map((d, i) => (
                    <div key={d.name} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#1a1414", border: "1px solid #2a1414",
                      borderRadius: 8, padding: "7px 10px",
                    }}>
                      <span style={{ fontSize: 10, color: "#555", fontWeight: 700, width: 16, textAlign: "center" }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#fca5a5" }}>
                        {d.name}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button
                          onClick={() => moveDay(i, -1)}
                          disabled={i === 0}
                          style={{
                            background: "none", border: "none", cursor: i === 0 ? "default" : "pointer",
                            color: i === 0 ? "#2a1414" : "#9f1239", fontSize: 11, padding: "0 4px",
                            lineHeight: 1, fontFamily: "inherit",
                          }}
                        >▲</button>
                        <button
                          onClick={() => moveDay(i, 1)}
                          disabled={i === (draft.days || []).length - 1}
                          style={{
                            background: "none", border: "none",
                            cursor: i === (draft.days || []).length - 1 ? "default" : "pointer",
                            color: i === (draft.days || []).length - 1 ? "#2a1414" : "#9f1239",
                            fontSize: 11, padding: "0 4px", lineHeight: 1, fontFamily: "inherit",
                          }}
                        >▼</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(draft.days || []).length > 0 && (
              <>
                <div style={{
                  display: "flex", gap: 0, overflowX: "auto",
                  borderBottom: "1px solid #2a1414", marginBottom: 14,
                }}>
                  {(draft.days || []).map((d, i) => (
                    <button key={d.name} onClick={() => setActiveDayIdx(i)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "inherit", fontWeight: activeDayIdx === i ? 700 : 400,
                      fontSize: 11, letterSpacing: 1, padding: "8px 14px",
                      color: activeDayIdx === i ? "#fca5a5" : "#555",
                      borderBottom: activeDayIdx === i ? "2px solid #ef4444" : "2px solid transparent",
                      whiteSpace: "nowrap",
                    }}>
                      {d.name.slice(0, 3).toUpperCase()}
                      <span style={{ marginLeft: 4, fontSize: 9, color: "#7a4040" }}>
                        ({d.workouts.length})
                      </span>
                    </button>
                  ))}
                </div>

                {currentDay && (
                  <div style={{ marginBottom: 16 }}>
                    {currentDay.workouts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#3a2020", fontSize: 11, letterSpacing: 2 }}>
                        NO EXERCISES — ADD ONE BELOW
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        {currentDay.workouts.map((ex) => (
                          <div key={ex.id} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            background: "#1a1414", border: "1px solid #2a1414",
                            borderRadius: 8, padding: "10px 12px",
                          }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{ex.name}</div>
                              <div style={{ fontSize: 10, color: "#7a4040", marginTop: 2 }}>
                                {ex.sets.length} sets × {ex.sets[0]?.reps} reps
                                {Number(ex.sets[0]?.weight) > 0 ? ` · ${ex.sets[0].weight} ${ex.unit}` : " · Bodyweight"}
                              </div>
                            </div>
                            <button onClick={() => removeExercise(activeDayIdx, ex.id)} style={{ ...iconBtnS, color: "#3a1414", fontSize: 18 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowPicker(true)}
                      style={{ ...primaryBtnS, width: "100%", padding: "10px", fontSize: 11, letterSpacing: 2 }}
                    >
                      + ADD EXERCISE TO {currentDay.name.toUpperCase()}
                    </button>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 8 }}>
              <button
                onClick={isEditing ? saveEditActive : saveProgram}
                disabled={isEditing ? !(draft.days?.length) : (!draft.name?.trim() || !(draft.days?.length))}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10,
                  fontFamily: "inherit", fontWeight: 700, fontSize: 13,
                  letterSpacing: 2, cursor: "pointer",
                  background: (isEditing ? draft.days?.length : draft.name?.trim() && draft.days?.length)
                    ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
                    : "#1a1414",
                  border: `1px solid ${(isEditing ? draft.days?.length : draft.name?.trim() && draft.days?.length) ? "#dc2626" : "#2a1414"}`,
                  color: (isEditing ? draft.days?.length : draft.name?.trim() && draft.days?.length) ? "#fca5a5" : "#3a2020",
                }}
              >
                {isEditing ? "SAVE CHANGES" : "SAVE PROGRAM"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: "1px solid #2a2020", background: "#1a1414",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#ef4444" }}>
          PROGRAMS
        </div>
        <button onClick={onClose} style={{ ...iconBtnS, fontSize: 18 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* ── CURRENT PROGRAM ──────────────────────────────────────────────── */}
        {activeProgram ? (
          <div style={{
            background: "#1a0a0a", border: "1px solid #991b1b",
            borderRadius: 12, padding: 14, marginBottom: 20,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#9f1239", marginBottom: 6 }}>
              CURRENT PROGRAM
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{activeProgram.name}</div>
            <div style={{ fontSize: 10, color: "#7a4040", marginBottom: 12 }}>
              {activeProgram.weeks} weeks · {activeProgram.days.length} days/week
              {weeksCompleted > 0 ? ` · Week ${weeksCompleted} in progress` : ""}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={startEditActive}
                style={{ ...primaryBtnS, flex: 1, padding: "8px", fontSize: 10, letterSpacing: 1, minWidth: 80 }}
              >
                ✎ EDIT DAYS
              </button>

              {showEndConfirm ? (
                <div style={{ flex: "1 1 100%", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: "#f87171" }}>
                    Type <strong style={{ color: "#fca5a5" }}>end program</strong> to confirm:
                  </div>
                  <input
                    value={endInput}
                    onChange={e => setEndInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && tryEndProgram()}
                    placeholder="end program"
                    style={{ ...inputS, fontSize: 12, padding: "7px 10px" }}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={tryEndProgram}
                      disabled={endInput.toLowerCase().trim() !== "end program"}
                      style={{
                        flex: 1, padding: "7px", borderRadius: 8,
                        fontFamily: "inherit", fontWeight: 700, fontSize: 10,
                        letterSpacing: 1, cursor: "pointer",
                        background: endInput.toLowerCase().trim() === "end program" ? "#7f1d1d" : "#1a1414",
                        border: `1px solid ${endInput.toLowerCase().trim() === "end program" ? "#dc2626" : "#2a1414"}`,
                        color: endInput.toLowerCase().trim() === "end program" ? "#fca5a5" : "#3a2020",
                      }}
                    >
                      CONFIRM END
                    </button>
                    <button
                      onClick={() => { setShowEndConfirm(false); setEndInput(""); }}
                      style={{ ...iconBtnS, border: "1px solid #2a1414", padding: "7px 12px", borderRadius: 8, fontSize: 10 }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, fontFamily: "inherit",
                    fontWeight: 700, fontSize: 10, letterSpacing: 1, cursor: "pointer",
                    background: "none", border: "1px solid #7f1d1d", color: "#f87171",
                    minWidth: 80,
                  }}
                >
                  ■ END PROGRAM
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: "#130808", border: "1px solid #2a1414",
            borderRadius: 12, padding: 14, marginBottom: 20, textAlign: "center",
          }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#9f1239", marginBottom: 6 }}>
              CURRENT PROGRAM
            </div>
            <div style={{ fontSize: 11, color: "#3a2020" }}>No active program</div>
          </div>
        )}

        {/* ── NEW PROGRAM ───────────────────────────────────────────────────── */}
        <button
          onClick={startNew}
          style={{ ...primaryBtnS, width: "100%", padding: "12px", marginBottom: 20, fontSize: 12, letterSpacing: 2 }}
        >
          + NEW PROGRAM
        </button>

        {/* ── Saved programs ────────────────────────────────────────────────── */}
        {programs.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#3a2020" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 11, letterSpacing: 2 }}>NO SAVED PROGRAMS</div>
          </div>
        )}

        {programs.map(p => (
          <div key={p.id} style={{
            background: "#1a1414",
            border: `1px solid ${activeProgram?.id === p.id ? "#991b1b" : "#2a1414"}`,
            borderRadius: 10, padding: 14, marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#7a4040", marginTop: 2 }}>
                  {p.weeks} weeks · {p.days.length} days/week · {p.days.reduce((a, d) => a + d.workouts.length, 0)} exercises
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                  {p.days.map(d => d.name.slice(0, 3).toUpperCase()).join(" · ")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {confirmDelete === p.id ? (
                  <>
                    <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }}
                      style={{ ...iconBtnS, color: "#ef4444", fontSize: 11, border: "1px solid #7f1d1d", padding: "4px 8px", borderRadius: 6 }}>
                      DEL
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      style={{ ...iconBtnS, fontSize: 11, border: "1px solid #2a1414", padding: "4px 8px", borderRadius: 6 }}>
                      NO
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(p.id)} style={{ ...iconBtnS, color: "#3a1414" }}>
                    🗑
                  </button>
                )}
              </div>
            </div>

            {activeProgram?.id === p.id ? (
              <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, letterSpacing: 2, textAlign: "center", padding: "6px 0" }}>
                ● CURRENTLY ACTIVE
              </div>
            ) : activeProgram ? (
              <div style={{ fontSize: 10, color: "#3a2020", textAlign: "center", padding: "6px 0", fontStyle: "italic" }}>
                End current program to activate this one
              </div>
            ) : (
              <button
                onClick={() => onActivate(p)}
                style={{ ...primaryBtnS, width: "100%", padding: "8px", fontSize: 11, letterSpacing: 2 }}
              >
                ACTIVATE PROGRAM →
              </button>
            )}
          </div>
        ))}

        {/* ── Archived ─────────────────────────────────────────────────────── */}
        {archivedPrograms.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowArchived(v => !v)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "10px 0",
                borderTop: "1px solid #2a1414",
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: 2, color: "#555", fontWeight: 700 }}>
                FINISHED PROGRAMS ({archivedPrograms.length})
              </span>
              <span style={{ color: "#555", fontSize: 14 }}>{showArchived ? "▲" : "▼"}</span>
            </button>

            {showArchived && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {archivedPrograms.map(ap => (
                  <div key={`${ap.id}-${ap.archivedAt}`} style={{
                    background: "#130808", border: "1px solid #1a1414",
                    borderRadius: 10, padding: 12, opacity: 0.75,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{ap.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                      {ap.weeks} weeks · {ap.days.length} days/week
                    </div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                      Completed {ap.weeksCompleted}/{ap.weeks} weeks ·{" "}
                      Ended {new Date(ap.archivedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
