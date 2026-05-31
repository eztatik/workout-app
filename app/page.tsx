"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "workout-tracker-data-v9";
const DAYS = ["Saturday", "Sunday", "Monday", "Wednesday"];
const DAY_SHORT = ["SAT", "SUN", "MON", "WED"];
const TOTAL_WEEKS = 7;

function progressDay(sourceDay: any, weekOffset: number) {
  // weekOffset: 1 = next week, 2 = week after, etc.
  return {
    ...sourceDay,
    workouts: sourceDay.workouts.map((w: any) => {
      const newSets = w.sets.map((s: any) => {
        const isBodyweight = Number(s.weight) === 0;
        let newReps = Number(s.reps);
        let newWeight = Number(s.weight);
        if (isBodyweight) {
          newReps += weekOffset;
        } else {
          const isRepWeek = weekOffset % 2 === 1;
          if (isRepWeek) {
            newReps += 1;
          } else {
            const inc = Math.max(
              2.5,
              Math.round((newWeight * 0.05) / 2.5) * 2.5,
            );
            newWeight += inc;
          }
        }
        return {
          ...s,
          id: Math.random(),
          reps: String(newReps),
          weight: String(newWeight),
          logged: false,
        };
      });
      const isBodyweight = Number(w.sets[0]?.weight) === 0;
      const isRepWeek = weekOffset % 2 === 1;
      let tip = "";
      if (isBodyweight)
        tip = `+${weekOffset} rep${weekOffset > 1 ? "s" : ""} from Week 1`;
      else if (isRepWeek) tip = "+1 rep per set";
      else {
        const inc = Math.max(
          2.5,
          Math.round((Number(w.sets[0]?.weight) * 0.05) / 2.5) * 2.5,
        );
        tip = `+${inc}${w.unit} progressive overload`;
      }
      return { ...w, sets: newSets, tip, aiGenerated: true };
    }),
  };
}

function buildWorkout(
  id: number,
  name: string,
  unit: string,
  setsData: number[][],
  note = "",
) {
  return {
    id,
    name,
    unit,
    note,
    sets: setsData.map(([weight, reps]) => ({
      id: Math.random(),
      weight: String(weight),
      reps: String(reps),
      logged: false,
    })),
  };
}

function buildAllWeeks() {
  // Week 1 baseline days
  const baseDays = [
    {
      name: "Saturday",
      workouts: [
        buildWorkout(1, "Smith Machine Press (Incline, Medium Grip)", "lbs", [
          [125, 11],
          [125, 10],
        ]),
        buildWorkout(2, "Smith Machine Bench Press (Medium Grip)", "lbs", [
          [175, 10],
          [175, 9],
        ]),
        buildWorkout(3, "Cable Flye", "lbs", [
          [30, 12],
          [30, 12],
        ]),
        buildWorkout(4, "Cable Triceps Pushdown (Bar)", "lbs", [
          [70, 11],
          [70, 10],
        ]),
        buildWorkout(5, "Cable Hammer Curl (Rope)", "lbs", [
          [45, 13],
          [45, 12],
          [45, 12],
        ]),
      ],
    },
    {
      name: "Sunday",
      workouts: [
        buildWorkout(10, "Laying Leg Press", "lbs", [
          [180, 14],
          [180, 12],
        ]),
        buildWorkout(11, "Leg Extension", "lbs", [
          [200, 9],
          [200, 9],
        ]),
        buildWorkout(12, "Seated Leg Curl", "lbs", [[180, 9]], "3 RIR"),
        buildWorkout(13, "Smith Machine Calves", "lbs", [
          [125, 17],
          [125, 12],
        ]),
        buildWorkout(
          14,
          "Freemotion Rear Delt Flyes",
          "lbs",
          [
            [0, 12],
            [0, 12],
            [0, 12],
          ],
          "3 RIR — add weight once known",
        ),
      ],
    },
    {
      name: "Monday",
      workouts: [
        buildWorkout(
          20,
          "Assisted Pullup (Normal Grip)",
          "lbs",
          [
            [53.1, 8],
            [53.1, 8],
          ],
          "3 RIR — machine assistance",
        ),
        buildWorkout(
          21,
          "Assisted Pullup (Underhand Grip)",
          "lbs",
          [
            [43.1, 8],
            [43.1, 8],
          ],
          "3 RIR — machine assistance",
        ),
        buildWorkout(22, "Pulldown (Rope)", "lbs", [
          [60, 7],
          [60, 7],
        ]),
        buildWorkout(
          23,
          "Cable Curl",
          "lbs",
          [
            [50, 10],
            [50, 10],
            [50, 10],
          ],
          "3 RIR",
        ),
        buildWorkout(
          24,
          "Reverse Bicep Curl",
          "lbs",
          [
            [40, 10],
            [40, 10],
            [40, 10],
          ],
          "3 RIR",
        ),
      ],
    },
    {
      name: "Wednesday",
      workouts: [
        buildWorkout(30, "Smith Machine Shoulder Press (Seated)", "lbs", [
          [85, 8],
          [85, 8],
          [85, 7],
        ]),
        buildWorkout(31, "Cable Leaning Lateral Raise", "lbs", [
          [20, 7],
          [20, 7],
          [20, 7],
        ]),
        buildWorkout(
          32,
          "Cable Rope Facepull",
          "lbs",
          [
            [0, 10],
            [0, 10],
            [0, 10],
          ],
          "3 RIR — add weight once known",
        ),
        buildWorkout(
          33,
          "Barbell Curl (Normal Grip)",
          "lbs",
          [
            [0, 10],
            [0, 10],
            [0, 10],
          ],
          "3 RIR — add weight once known",
        ),
        buildWorkout(
          34,
          "Cable Hammer Curl (Rope)",
          "lbs",
          [
            [0, 10],
            [0, 10],
            [0, 10],
          ],
          "3 RIR — add weight once known",
        ),
      ],
    },
  ];

  return Array.from({ length: TOTAL_WEEKS }, (_, wi) => ({
    label: `Week ${wi + 1}`,
    aiGenerated: wi > 0,
    days: baseDays.map((day, di) =>
      wi === 0 ? { ...day } : progressDay(day, wi),
    ),
  }));
}

export default function WorkoutTracker() {
  const [weeks, setWeeks] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return buildAllWeeks();
  });

  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    sets: "3",
    reps: "8",
    weight: "0",
    unit: "lbs",
    note: "",
  });
  const [editingName, setEditingName] = useState<number | null>(null);
  const [dayFinished, setDayFinished] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(STORAGE_KEY + "-finished");
          if (saved) return JSON.parse(saved);
        } catch {}
      }
      return {};
    },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "synced",
  );

  // Load data from database on mount
  useEffect(() => {
    async function loadFromDb() {
      try {
        const response = await fetch("/api/workouts");
        if (response.ok) {
          const data = await response.json();
          if (data.weeks) {
            setWeeks(data.weeks);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.weeks));
          }
          if (data.dayFinished) {
            setDayFinished(data.dayFinished);
            localStorage.setItem(
              STORAGE_KEY + "-finished",
              JSON.stringify(data.dayFinished),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load from database:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFromDb();
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
      } catch {}
    }
  }, [weeks, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try {
        localStorage.setItem(
          STORAGE_KEY + "-finished",
          JSON.stringify(dayFinished),
        );
      } catch {}
    }
  }, [dayFinished, isLoading]);

  // Sync to database (debounced)
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const response = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weeks, dayFinished }),
        });
        if (response.ok) {
          setSyncStatus("synced");
        } else {
          setSyncStatus("error");
        }
      } catch (error) {
        console.error("Failed to sync to database:", error);
        setSyncStatus("error");
      }
    }, 2000); // Debounce for 2 seconds

    return () => clearTimeout(timeoutId);
  }, [weeks, dayFinished, isLoading]);

  // When a day is finished, push its actual logged data into all future weeks for that day
  function finishDay() {
    const key = `${activeWeek}-${activeDay}`;
    if (dayFinished[key]) return;
    setDayFinished((prev) => ({ ...prev, [key]: true }));

    // Get the current day's actual workout data (with logged weights/reps)
    const currentDayData = weeks[activeWeek].days[activeDay];

    // Update all future weeks for this same day index using progressive overload from THIS week's data
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) => {
        if (wi <= activeWeek) return week; // don't touch current or past weeks
        const weekOffset = wi - activeWeek;
        const progressedDay = progressDay(currentDayData, weekOffset);
        return {
          ...week,
          days: week.days.map((day: any, di: number) =>
            di === activeDay ? progressedDay : day,
          ),
        };
      }),
    );
  }

  function updateSet(
    workoutId: number,
    setId: number,
    field: string,
    value: string,
  ) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.map((w: any) =>
                        w.id !== workoutId
                          ? w
                          : {
                              ...w,
                              sets: w.sets.map((s: any) =>
                                s.id !== setId ? s : { ...s, [field]: value },
                              ),
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function toggleLogged(workoutId: number, setId: number) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.map((w: any) =>
                        w.id !== workoutId
                          ? w
                          : {
                              ...w,
                              sets: w.sets.map((s: any) =>
                                s.id !== setId
                                  ? s
                                  : { ...s, logged: !s.logged },
                              ),
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function addSet(workoutId: number) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.map((w: any) => {
                        if (w.id !== workoutId) return w;
                        const last = w.sets[w.sets.length - 1];
                        return {
                          ...w,
                          sets: [
                            ...w.sets,
                            {
                              id: Math.random(),
                              weight: last?.weight || "0",
                              reps: last?.reps || "8",
                              logged: false,
                            },
                          ],
                        };
                      }),
                    },
              ),
            },
      ),
    );
  }

  function removeSet(workoutId: number, setId: number) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.map((w: any) =>
                        w.id !== workoutId
                          ? w
                          : {
                              ...w,
                              sets: w.sets.filter((s: any) => s.id !== setId),
                            },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function removeWorkout(id: number) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.filter((w: any) => w.id !== id),
                    },
              ),
            },
      ),
    );
  }

  function updateWorkoutName(id: number, name: string) {
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: day.workouts.map((w: any) =>
                        w.id !== id ? w : { ...w, name },
                      ),
                    },
              ),
            },
      ),
    );
  }

  function addWorkout() {
    if (!newWorkout.name.trim()) return;
    const numSets = Number(newWorkout.sets) || 1;
    const sets = Array.from({ length: numSets }, () => ({
      id: Math.random(),
      weight: newWorkout.weight,
      reps: newWorkout.reps,
      logged: false,
    }));
    const workout = {
      id: Math.random(),
      name: newWorkout.name,
      unit: newWorkout.unit,
      note: newWorkout.note,
      sets,
    };
    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) =>
        wi !== activeWeek
          ? week
          : {
              ...week,
              days: week.days.map((day: any, di: number) =>
                di !== activeDay
                  ? day
                  : {
                      ...day,
                      workouts: [...day.workouts, workout],
                    },
              ),
            },
      ),
    );
    setNewWorkout({
      name: "",
      sets: "3",
      reps: "8",
      weight: "0",
      unit: "lbs",
      note: "",
    });
    setShowAddForm(false);
  }

  function resetAll() {
    const fresh = buildAllWeeks();
    setWeeks(fresh);
    setDayFinished({});
    setActiveWeek(0);
    setActiveDay(0);
    setConfirmReset(false);
  }

  const currentWeek = weeks[activeWeek];
  const currentDay = currentWeek?.days[activeDay];
  const isBaseline = activeWeek === 0;
  const dayKey = `${activeWeek}-${activeDay}`;
  const isDayDone = !!dayFinished[dayKey];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111116",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1a1a22",
          borderBottom: "1px solid #2a2a38",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              color: "#7c6fcd",
              marginBottom: 2,
            }}
          >
            4 DAY FAT LOSS
          </div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}
          >
            LIFT<span style={{ color: "#8b5cf6" }}>LOG</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Sync Status */}
          {syncStatus === "syncing" && (
            <span style={{ fontSize: 10, color: "#7c6fcd" }}>
              💾 Syncing...
            </span>
          )}
          {syncStatus === "synced" && (
            <span style={{ fontSize: 10, color: "#4ade80" }}>✓ Saved</span>
          )}
          {syncStatus === "error" && (
            <span style={{ fontSize: 10, color: "#f87171" }}>⚠ Offline</span>
          )}

          {confirmReset ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#f87171" }}>Sure?</span>
              <button
                onClick={resetAll}
                style={{
                  ...ghostBtn,
                  color: "#f87171",
                  borderColor: "#5a2020",
                  fontSize: 11,
                  padding: "6px 12px",
                }}
              >
                YES
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{ ...ghostBtn, fontSize: 11, padding: "6px 12px" }}
              >
                NO
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              style={{ ...ghostBtn, fontSize: 11, padding: "6px 12px" }}
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Week tabs */}
      <div
        style={{
          display: "flex",
          background: "#141418",
          borderBottom: "1px solid #222230",
          overflowX: "auto",
          padding: "0 16px",
        }}
      >
        {weeks.map((w: any, i: number) => {
          const weekDone = DAYS.every((_, di) => dayFinished[`${i}-${di}`]);
          return (
            <button
              key={i}
              onClick={() => {
                setActiveWeek(i);
                setActiveDay(0);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeWeek === i
                    ? "2px solid #8b5cf6"
                    : "2px solid transparent",
                color:
                  activeWeek === i
                    ? "#c4b5fd"
                    : weekDone
                      ? "#4ade80"
                      : "#555570",
                padding: "10px 14px",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: activeWeek === i ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {weekDone ? "✓ " : ""}
              {w.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Day tabs */}
      <div
        style={{
          display: "flex",
          background: "#111116",
          borderBottom: "1px solid #1e1e28",
          padding: "0 16px",
        }}
      >
        {DAYS.map((day, i) => {
          const done = dayFinished[`${activeWeek}-${i}`];
          return (
            <button
              key={i}
              onClick={() => {
                setActiveDay(i);
                setShowAddForm(false);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeDay === i
                    ? "2px solid #6366f1"
                    : "2px solid transparent",
                color:
                  activeDay === i ? "#a5b4fc" : done ? "#4ade80" : "#444460",
                padding: "9px 14px",
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: activeDay === i ? 700 : 400,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {done ? "✓ " : ""}
              {DAY_SHORT[i]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        style={{ padding: "16px 16px 60px", maxWidth: 680, margin: "0 auto" }}
      >
        {/* Day header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: "#6366f1",
                marginBottom: 2,
              }}
            >
              {currentWeek.label.toUpperCase()} ·{" "}
              {currentWeek.aiGenerated && activeWeek > 0
                ? "PROGRESSIVE"
                : "BASELINE"}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {DAYS[activeDay]}
            </h2>
          </div>
          <button onClick={() => setShowAddForm((v) => !v)} style={primaryBtn}>
            {showAddForm ? "CANCEL" : "+ ADD"}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div
            style={{
              background: "#1a1a26",
              border: "1px solid #2a2a44",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: "#7c6fcd",
                marginBottom: 12,
              }}
            >
              NEW EXERCISE
            </div>
            <input
              placeholder="Exercise name"
              value={newWorkout.name}
              onChange={(e) =>
                setNewWorkout({ ...newWorkout, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && addWorkout()}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <input
                inputMode="numeric"
                placeholder="Sets"
                value={newWorkout.sets}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, sets: e.target.value })
                }
                style={inputStyle}
              />
              <input
                inputMode="numeric"
                placeholder="Reps"
                value={newWorkout.reps}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, reps: e.target.value })
                }
                style={inputStyle}
              />
              <input
                inputMode="decimal"
                placeholder="Weight"
                value={newWorkout.weight}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, weight: e.target.value })
                }
                style={inputStyle}
              />
              <select
                value={newWorkout.unit}
                onChange={(e) =>
                  setNewWorkout({ ...newWorkout, unit: e.target.value })
                }
                style={{ ...inputStyle, width: "auto" }}
              >
                <option>lbs</option>
                <option>kg</option>
              </select>
            </div>
            <input
              placeholder="Notes (optional)"
              value={newWorkout.note}
              onChange={(e) =>
                setNewWorkout({ ...newWorkout, note: e.target.value })
              }
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <button
              onClick={addWorkout}
              style={{ ...primaryBtn, width: "100%", padding: "10px" }}
            >
              ADD EXERCISE
            </button>
          </div>
        )}

        {/* Workout cards */}
        {!currentDay || currentDay.workouts.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: "#333350" }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏋️</div>
            <div style={{ fontSize: 11, letterSpacing: 2 }}>
              NO EXERCISES FOR {DAYS[activeDay].toUpperCase()}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {currentDay.workouts.map((w: any) => {
              const allLogged = w.sets.every((s: any) => s.logged);
              return (
                <div
                  key={w.id}
                  style={{
                    background: "#1a1a22",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${allLogged ? "#166534" : "#252535"}`,
                  }}
                >
                  {/* Exercise header */}
                  <div
                    style={{
                      padding: "12px 14px 10px",
                      borderBottom: "1px solid #222232",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {editingName === w.id ? (
                        <input
                          autoFocus
                          value={w.name}
                          onChange={(e) =>
                            updateWorkoutName(w.id, e.target.value)
                          }
                          onBlur={() => setEditingName(null)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setEditingName(null)
                          }
                          style={{
                            ...inputStyle,
                            fontSize: 14,
                            fontWeight: 700,
                            flex: 1,
                            marginRight: 8,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flex: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          {allLogged && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "#14532d",
                                color: "#4ade80",
                                borderRadius: 4,
                                padding: "2px 6px",
                                letterSpacing: 1,
                              }}
                            >
                              ✓ DONE
                            </span>
                          )}
                          {w.aiGenerated && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "#2e1065",
                                color: "#a78bfa",
                                borderRadius: 4,
                                padding: "2px 6px",
                                letterSpacing: 1,
                              }}
                            >
                              ✦ AI
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#fff",
                            }}
                          >
                            {w.name}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() =>
                            setEditingName(editingName === w.id ? null : w.id)
                          }
                          style={iconBtn}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => removeWorkout(w.id)}
                          style={{ ...iconBtn, color: "#444" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {w.tip && (
                      <div
                        style={{ marginTop: 4, fontSize: 11, color: "#7c6fcd" }}
                      >
                        💡 {w.tip}
                      </div>
                    )}
                    {w.note && !w.tip && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: "#555570",
                          fontStyle: "italic",
                        }}
                      >
                        {w.note}
                      </div>
                    )}
                  </div>

                  {/* Column headers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 1fr 1fr 44px",
                      gap: 6,
                      padding: "8px 14px 4px",
                      borderBottom: "1px solid #1e1e2a",
                    }}
                  >
                    <div style={colHeader}></div>
                    <div style={colHeader}>WEIGHT</div>
                    <div style={colHeader}>REPS</div>
                    <div style={{ ...colHeader, textAlign: "center" }}>LOG</div>
                  </div>

                  {/* Set rows */}
                  {w.sets.map((s: any, si: number) => (
                    <div
                      key={s.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 1fr 1fr 44px",
                        gap: 6,
                        padding: "6px 14px",
                        background: s.logged ? "#0f2318" : "transparent",
                        borderBottom: "1px solid #1a1a24",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#444460",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        {si + 1}
                      </div>
                      <input
                        inputMode="decimal"
                        value={s.weight}
                        onChange={(e) =>
                          updateSet(w.id, s.id, "weight", e.target.value)
                        }
                        style={{
                          ...setInput,
                          color: s.logged ? "#4ade80" : "#fff",
                          background: s.logged ? "#0a1f12" : "#0d0d16",
                          border: `1px solid ${s.logged ? "#166534" : "#2a2a40"}`,
                        }}
                      />
                      <input
                        inputMode="numeric"
                        value={s.reps}
                        onChange={(e) =>
                          updateSet(w.id, s.id, "reps", e.target.value)
                        }
                        style={{
                          ...setInput,
                          color: s.logged ? "#4ade80" : "#fff",
                          background: s.logged ? "#0a1f12" : "#0d0d16",
                          border: `1px solid ${s.logged ? "#166534" : "#2a2a40"}`,
                        }}
                      />
                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <div
                          onClick={() => toggleLogged(w.id, s.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: `2px solid ${s.logged ? "#16a34a" : "#333355"}`,
                            background: s.logged ? "#16a34a" : "transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                        >
                          {s.logged && (
                            <span
                              style={{
                                color: "#fff",
                                fontSize: 14,
                                lineHeight: 1,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add/remove set */}
                  <div style={{ padding: "8px 14px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => addSet(w.id)}
                      style={{
                        fontSize: 11,
                        color: "#7c6fcd",
                        background: "none",
                        border: "1px solid #2a2a44",
                        borderRadius: 6,
                        padding: "5px 12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      + SET
                    </button>
                    {w.sets.length > 1 && (
                      <button
                        onClick={() =>
                          removeSet(w.id, w.sets[w.sets.length - 1].id)
                        }
                        style={{
                          fontSize: 11,
                          color: "#555570",
                          background: "none",
                          border: "1px solid #222234",
                          borderRadius: 6,
                          padding: "5px 12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        − SET
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finish Workout Button */}
        {currentDay && currentDay.workouts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {!isDayDone ? (
              <button
                onClick={finishDay}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(135deg, #14532d, #166534)",
                  border: "1px solid #16a34a",
                  borderRadius: 12,
                  color: "#4ade80",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 2,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>🏁</span> FINISH WORKOUT
              </button>
            ) : (
              <div
                style={{
                  background: "#0a1f12",
                  border: "1px solid #166534",
                  borderRadius: 12,
                  padding: 18,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#4ade80",
                    fontWeight: 700,
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  {DAYS[activeDay].toUpperCase()} WEEK {activeWeek + 1} COMPLETE
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#555570",
                    marginBottom: activeWeek < TOTAL_WEEKS - 1 ? 12 : 0,
                  }}
                >
                  Next {DAYS[activeDay]} updated with progressive overload
                  through Week {TOTAL_WEEKS}
                </div>
                {activeWeek < TOTAL_WEEKS - 1 && (
                  <button
                    onClick={() => {
                      setActiveWeek(activeWeek + 1);
                    }}
                    style={{ ...primaryBtn, fontSize: 11, marginTop: 4 }}
                  >
                    VIEW WEEK {activeWeek + 2} {DAYS[activeDay].toUpperCase()} →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#0d0d18",
  border: "1px solid #2a2a44",
  borderRadius: 8,
  padding: "9px 12px",
  color: "#fff",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
  outline: "none",
};
const setInput = {
  borderRadius: 8,
  padding: "8px 10px",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
  outline: "none",
  textAlign: "center" as const,
};
const primaryBtn = {
  background: "#2e1a6e",
  border: "1px solid #5a3aaa",
  color: "#c4b5fd",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 11,
  letterSpacing: 2,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 700,
};
const ghostBtn = {
  background: "none",
  border: "1px solid #2a2a44",
  color: "#4a4a6a",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit",
};
const iconBtn = {
  background: "none",
  border: "none",
  color: "#6a6a9a",
  cursor: "pointer",
  fontSize: 15,
  padding: "2px 6px",
  lineHeight: 1,
  fontFamily: "inherit",
};
const colHeader = {
  fontSize: 10,
  letterSpacing: 2,
  color: "#444460",
  fontWeight: 600,
  textAlign: "center" as const,
};

// Made with Bob
