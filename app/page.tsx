"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ProgramsPage, { type Program, type ArchivedProgram } from "./ProgramsPanel";

const STORAGE_KEY = "workout-tracker-data-v9";
const PROGRAMS_KEY = "workout-tracker-programs-v1";
const ACTIVE_PROGRAM_KEY = "workout-tracker-active-program-v1";
const ARCHIVED_PROGRAMS_KEY = "workout-tracker-archived-programs-v1";
const DAYS = ["Saturday", "Sunday", "Monday", "Wednesday"];
const DAY_SHORT = ["SAT", "SUN", "MON", "WED"];
const TOTAL_WEEKS = 7;
const DEFAULT_REST_SECONDS = 90;

// ─── data helpers ────────────────────────────────────────────────────────────

function progressDay(sourceDay: any, weekOffset: number) {
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
    days: baseDays.map((day) =>
      wi === 0 ? { ...day } : progressDay(day, wi),
    ),
  }));
}

// Return the best (max) logged weight × reps for a given exercise name across
// all weeks prior to `beforeWeekIndex`, for a specific set index.
// Returns null if no prior logged data exists.
function getPrevPerf(
  weeks: any[],
  dayFinished: Record<string, boolean>,
  beforeWeekIndex: number,
  dayIndex: number,
  workoutName: string,
  setIndex: number,
): { weight: string; reps: string } | null {
  // Walk backwards from the most recent finished week before current
  for (let wi = beforeWeekIndex - 1; wi >= 0; wi--) {
    const key = `${wi}-${dayIndex}`;
    if (!dayFinished[key]) continue;
    const day = weeks[wi]?.days[dayIndex];
    if (!day) continue;
    const workout = day.workouts.find((w: any) => w.name === workoutName);
    if (!workout) continue;
    const set = workout.sets[setIndex];
    if (!set) continue;
    return { weight: set.weight, reps: set.reps };
  }
  return null;
}

// Check if the logged set is an all-time PR for that exercise name across prior
// finished weeks (for the same day index). Returns true if it beats everything.
function checkIsPR(
  weeks: any[],
  dayFinished: Record<string, boolean>,
  currentWeekIndex: number,
  dayIndex: number,
  workoutName: string,
  weight: string,
  reps: string,
): boolean {
  const w = Number(weight);
  const r = Number(reps);
  const isBodyweight = w === 0;

  for (let wi = 0; wi < currentWeekIndex; wi++) {
    const key = `${wi}-${dayIndex}`;
    if (!dayFinished[key]) continue;
    const day = weeks[wi]?.days[dayIndex];
    if (!day) continue;
    const workout = day.workouts.find((wo: any) => wo.name === workoutName);
    if (!workout) continue;
    for (const s of workout.sets) {
      const sw = Number(s.weight);
      const sr = Number(s.reps);
      if (isBodyweight) {
        if (sr >= r) return false;
      } else {
        if (sw > w) return false;
        if (sw === w && sr >= r) return false;
      }
    }
  }
  // Only meaningful if there's at least one prior finished week to compare
  for (let wi = 0; wi < currentWeekIndex; wi++) {
    if (dayFinished[`${wi}-${dayIndex}`]) return true;
  }
  return false;
}

// ─── component ───────────────────────────────────────────────────────────────

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PROGRAMS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [activeProgram, setActiveProgram] = useState<Program | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(ACTIVE_PROGRAM_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [archivedPrograms, setArchivedPrograms] = useState<ArchivedProgram[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(ARCHIVED_PROGRAMS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // ── Rest timer ──────────────────────────────────────────────────────────────
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

  const startRestTimer = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestSeconds(restDuration);
    setRestActive(true);
    restIntervalRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current!);
          setRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restDuration]);

  const dismissRestTimer = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestActive(false);
    setRestSeconds(0);
  }, []);

  useEffect(() => () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); }, []);

  // ── PR banner ───────────────────────────────────────────────────────────────
  const [prBanner, setPrBanner] = useState<string | null>(null);
  const prTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPR = useCallback((exerciseName: string) => {
    if (prTimeoutRef.current) clearTimeout(prTimeoutRef.current);
    setPrBanner(exerciseName);
    prTimeoutRef.current = setTimeout(() => setPrBanner(null), 4000);
  }, []);

  // ── Workout start time for duration tracking ─────────────────────────────
  const workoutStartRef = useRef<number | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<{
    sets: number;
    volume: number;
    durationMin: number;
  } | null>(null);

  // Start the clock on first set logged
  const markWorkoutStart = useCallback(() => {
    if (!workoutStartRef.current) {
      workoutStartRef.current = Date.now();
    }
  }, []);

  // ── DB sync ──────────────────────────────────────────────────────────────────
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
          if (Array.isArray(data.programs)) {
            setPrograms(data.programs);
            localStorage.setItem(PROGRAMS_KEY, JSON.stringify(data.programs));
          }
          if (data.activeProgram !== undefined) {
            setActiveProgram(data.activeProgram);
            localStorage.setItem(ACTIVE_PROGRAM_KEY, JSON.stringify(data.activeProgram));
          }
          if (Array.isArray(data.archivedPrograms)) {
            setArchivedPrograms(data.archivedPrograms);
            localStorage.setItem(ARCHIVED_PROGRAMS_KEY, JSON.stringify(data.archivedPrograms));
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

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try { localStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs)); } catch {}
    }
  }, [programs, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try { localStorage.setItem(ACTIVE_PROGRAM_KEY, JSON.stringify(activeProgram)); } catch {}
    }
  }, [activeProgram, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      try { localStorage.setItem(ARCHIVED_PROGRAMS_KEY, JSON.stringify(archivedPrograms)); } catch {}
    }
  }, [archivedPrograms, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const timeoutId = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const response = await fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weeks, dayFinished, programs, activeProgram, archivedPrograms }),
        });
        setSyncStatus(response.ok ? "synced" : "error");
      } catch {
        setSyncStatus("error");
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [weeks, dayFinished, programs, activeProgram, archivedPrograms, isLoading]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  function finishDay() {
    const key = `${activeWeek}-${activeDay}`;
    if (dayFinished[key]) return;

    const currentDayData = weeks[activeWeek].days[activeDay];

    // Compute summary
    let totalSets = 0;
    let totalVolume = 0;
    currentDayData.workouts.forEach((w: any) => {
      w.sets.forEach((s: any) => {
        if (s.logged) {
          totalSets++;
          totalVolume += Number(s.weight) * Number(s.reps);
        }
      });
    });
    const durationMin = workoutStartRef.current
      ? Math.round((Date.now() - workoutStartRef.current) / 60000)
      : 0;
    workoutStartRef.current = null;
    setWorkoutSummary({ sets: totalSets, volume: totalVolume, durationMin });

    setDayFinished((prev) => ({ ...prev, [key]: true }));

    setWeeks((prev: any) =>
      prev.map((week: any, wi: number) => {
        if (wi <= activeWeek) return week;
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
    markWorkoutStart();

    // Determine if we're logging (not un-logging)
    const currentDay = weeks[activeWeek]?.days[activeDay];
    const workout = currentDay?.workouts.find((w: any) => w.id === workoutId);
    const set = workout?.sets.find((s: any) => s.id === setId);
    const willBeLogged = set ? !set.logged : false;

    if (willBeLogged) {
      // Start rest timer
      startRestTimer();

      // Check PR
      if (workout && set) {
        const isPR = checkIsPR(
          weeks,
          dayFinished,
          activeWeek,
          activeDay,
          workout.name,
          set.weight,
          set.reps,
        );
        if (isPR) showPR(workout.name);
      }
    }

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
    setWorkoutSummary(null);
    workoutStartRef.current = null;
  }

  function copyLastWeekToNewPlan() {
    const lastWeek = weeks[weeks.length - 1];
    const newBaseDays = lastWeek.days.map((day: any) => ({
      ...day,
      workouts: day.workouts.map((w: any) => ({
        ...w,
        tip: "",
        aiGenerated: false,
        sets: w.sets.map((s: any) => ({
          ...s,
          id: Math.random(),
          logged: false,
        })),
      })),
    }));

    const newWeeks = Array.from({ length: TOTAL_WEEKS }, (_, wi) => ({
      label: `Week ${wi + 1}`,
      aiGenerated: wi > 0,
      days: newBaseDays.map((day: any) =>
        wi === 0 ? { ...day } : progressDay(day, wi),
      ),
    }));

    setWeeks(newWeeks);
    setDayFinished({});
    setActiveWeek(0);
    setActiveDay(0);
    setWorkoutSummary(null);
    workoutStartRef.current = null;
  }

  function saveProgram(program: Program) {
    setPrograms(prev => {
      const exists = prev.find(p => p.id === program.id);
      return exists
        ? prev.map(p => p.id === program.id ? program : p)
        : [...prev, program];
    });
  }

  function deleteProgram(id: string) {
    setPrograms(prev => prev.filter(p => p.id !== id));
  }

  function buildProgramWeeks(program: Program) {
    function buildDay(pd: typeof program.days[0]) {
      return {
        name: pd.name,
        workouts: pd.workouts.map((w: any) => ({
          ...w,
          tip: "",
          aiGenerated: false,
          sets: w.sets.map((s: any) => ({ ...s, id: Math.random(), logged: false })),
        })),
      };
    }
    const baseDays = program.days.map(buildDay);
    return Array.from({ length: program.weeks }, (_, wi) => ({
      label: `Week ${wi + 1}`,
      aiGenerated: wi > 0,
      days: baseDays.map(day => wi === 0 ? { ...day } : progressDay(day, wi)),
    }));
  }

  function activateProgram(program: Program) {
    setActiveProgram(program);
    setWeeks(buildProgramWeeks(program));
    setDayFinished({});
    setActiveWeek(0);
    setActiveDay(0);
    setWorkoutSummary(null);
    workoutStartRef.current = null;
    setDrawerOpen(false);
  }

  function endProgram() {
    if (!activeProgram) return;
    const weeksCompleted = Object.keys(dayFinished).reduce((max, key) => {
      const wi = parseInt(key.split("-")[0], 10);
      return isNaN(wi) ? max : Math.max(max, wi + 1);
    }, 0);
    const archived: ArchivedProgram = {
      ...activeProgram,
      archivedAt: Date.now(),
      weeksCompleted,
    };
    setArchivedPrograms(prev => [...prev, archived]);
    setActiveProgram(null);
    // Keep the current tracker data as-is — don't wipe the user's progress
    setDrawerOpen(false);
  }

  function editActiveDays(updatedProgram: Program) {
    setPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
    setActiveProgram(updatedProgram);

    // Rebuild fresh weeks from the updated program template
    const freshWeeks = buildProgramWeeks(updatedProgram);

    setWeeks((prevWeeks: any) => {
      return freshWeeks.map((freshWeek: any, wi: number) => {
        const prevWeek = prevWeeks[wi];
        if (!prevWeek) return freshWeek; // brand-new week beyond old length — use fresh

        return {
          ...freshWeek,
          days: freshWeek.days.map((freshDay: any, di: number) => {
            const isDone = !!dayFinished[`${wi}-${di}`];
            if (isDone) {
              // Preserve the completed day exactly as logged — don't touch it
              return prevWeek.days[di] ?? freshDay;
            }
            // Not yet done — use the fresh template day
            return freshDay;
          }),
        };
      });
    });

    // dayFinished, activeWeek, activeDay, workoutSummary all stay as-is
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentWeek = weeks[activeWeek];
  const currentDay = currentWeek?.days[activeDay];
  const dayKey = `${activeWeek}-${activeDay}`;
  const isDayDone = !!dayFinished[dayKey];
  const isLastWeek = activeWeek === weeks.length - 1;
  const isLastWeekAllDone =
    isLastWeek &&
    DAYS.every((_, di) => dayFinished[`${activeWeek}-${di}`]);

  // Percentage of rest timer remaining for progress ring
  const restPct = restActive && restDuration > 0 ? restSeconds / restDuration : 0;
  const restCircum = 2 * Math.PI * 18; // radius 18

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111116",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
      }}
    >
      {/* ── Drawer overlay ────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex",
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }}
          />
          {/* Panel */}
          <div style={{
            position: "relative", zIndex: 1,
            width: Math.min(340, typeof window !== "undefined" ? window.innerWidth - 40 : 300),
            height: "100%",
            background: "#110a0a",
            borderRight: "1px solid #2a1414",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            <ProgramsPage
              programs={programs}
              activeProgram={activeProgram}
              archivedPrograms={archivedPrograms}
              weeksCompleted={activeWeek + 1}
              onSave={saveProgram}
              onActivate={activateProgram}
              onEndProgram={endProgram}
              onEditActiveDays={editActiveDays}
              onDelete={deleteProgram}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── PR Banner ─────────────────────────────────────────────────────────── */}
      {prBanner && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "linear-gradient(90deg, #991b1b, #dc2626)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
                PERSONAL RECORD!
              </div>
              <div style={{ fontSize: 11, color: "#fecaca" }}>{prBanner}</div>
            </div>
          </div>
          <button
            onClick={() => setPrBanner(null)}
            style={{ background: "none", border: "none", color: "#fecaca", cursor: "pointer", fontSize: 18, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Rest Timer Banner ──────────────────────────────────────────────────── */}
      {restActive && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99,
            background: "#1a1414",
            border: "1px solid #3b1414",
            borderRadius: 16,
            padding: "10px 20px 10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 220,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Circular countdown */}
          <svg width={44} height={44} style={{ flexShrink: 0 }}>
            <circle cx={22} cy={22} r={18} fill="none" stroke="#2a2020" strokeWidth={3} />
            <circle
              cx={22} cy={22} r={18} fill="none"
              stroke={restSeconds <= 10 ? "#f87171" : "#dc2626"}
              strokeWidth={3}
              strokeDasharray={restCircum}
              strokeDashoffset={restCircum * (1 - restPct)}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
            <text x={22} y={27} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={700} fontFamily="system-ui">
              {restSeconds}
            </text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", marginBottom: 2 }}>REST TIMER</div>
            <div style={{ fontSize: 12, color: "#cc9999" }}>
              {restSeconds > 0 ? `${restSeconds}s remaining` : "Time's up!"}
            </div>
          </div>
          {/* Duration selector */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {[60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => setRestDuration(sec)}
                style={{
                  background: restDuration === sec ? "#450a0a" : "none",
                  border: `1px solid ${restDuration === sec ? "#991b1b" : "#2a2020"}`,
                  color: restDuration === sec ? "#fca5a5" : "#555570",
                  borderRadius: 6,
                  padding: "3px 7px",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {sec}s
              </button>
            ))}
          </div>
          <button
            onClick={dismissRestTimer}
            style={{ background: "none", border: "none", color: "#444460", cursor: "pointer", fontSize: 18, padding: "0 2px", flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1a1a22",
          borderBottom: "1px solid #2a2a38",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: prBanner ? 48 : 0,
          transition: "margin-top 0.2s",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              color: "#9f1239",
              marginBottom: 2,
            }}
          >
            JHON'S
          </div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff" }}
          >
            LIFT<span style={{ color: "#ef4444" }}>LOG</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Hamburger — opens Programs drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "none", border: "1px solid #2a1414",
              borderRadius: 8, cursor: "pointer", padding: "6px 10px",
              display: "flex", flexDirection: "column", gap: 4,
            }}
            title="Programs"
          >
            <span style={{ display: "block", width: 16, height: 2, background: "#ef4444", borderRadius: 2 }} />
            <span style={{ display: "block", width: 12, height: 2, background: "#ef4444", borderRadius: 2 }} />
            <span style={{ display: "block", width: 16, height: 2, background: "#ef4444", borderRadius: 2 }} />
          </button>
          {syncStatus === "syncing" && (
            <span style={{ fontSize: 10, color: "#9f1239" }}>💾 Syncing...</span>
          )}
          {syncStatus === "synced" && (
            <span style={{ fontSize: 10, color: "#f87171" }}>✓ Saved</span>
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

      {/* ── Week tabs ─────────────────────────────────────────────────────────── */}
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
                setWorkoutSummary(null);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeWeek === i
                    ? "2px solid #ef4444"
                    : "2px solid transparent",
                color:
                  activeWeek === i
                    ? "#fca5a5"
                    : weekDone
                      ? "#f87171"
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

      {/* ── Day tabs ──────────────────────────────────────────────────────────── */}
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
                setWorkoutSummary(null);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeDay === i
                    ? "2px solid #dc2626"
                    : "2px solid transparent",
                color:
                  activeDay === i ? "#fca5a5" : done ? "#f87171" : "#444460",
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

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div
        style={{ padding: "16px 16px 120px", maxWidth: 680, margin: "0 auto" }}
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
                color: "#dc2626",
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
              background: "#1a1414",
              border: "1px solid #2a1414",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: "#9f1239",
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
                    border: `1px solid ${allLogged ? "#dc2626" : "#252535"}`,
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
                                background: "#450a0a",
                                color: "#f87171",
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
                                background: "#450a0a",
                                color: "#fca5a5",
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
                        style={{ marginTop: 4, fontSize: 11, color: "#9f1239" }}
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
                      gridTemplateColumns: "28px 1fr 1fr 1fr 44px",
                      gap: 6,
                      padding: "8px 14px 4px",
                      borderBottom: "1px solid #1e1e2a",
                    }}
                  >
                    <div style={colHeader}></div>
                    <div style={colHeader}>WEIGHT</div>
                    <div style={colHeader}>REPS</div>
                    <div style={{ ...colHeader, color: "#3a2020" }}>PREV</div>
                    <div style={{ ...colHeader, textAlign: "center" }}>LOG</div>
                  </div>

                  {/* Set rows */}
                  {w.sets.map((s: any, si: number) => {
                    const prev = getPrevPerf(
                      weeks,
                      dayFinished,
                      activeWeek,
                      activeDay,
                      w.name,
                      si,
                    );
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr 1fr 1fr 44px",
                          gap: 6,
                          padding: "6px 14px",
                          background: "transparent",
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
                            color: s.logged ? "#f87171" : "#fff",
                            background: "#0d0d0d",
                            border: `1px solid ${s.logged ? "#dc2626" : "#2a2020"}`,
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
                            color: s.logged ? "#f87171" : "#fff",
                            background: "#0d0d0d",
                            border: `1px solid ${s.logged ? "#dc2626" : "#2a2020"}`,
                          }}
                        />
                        {/* Previous performance */}
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 10,
                            color: prev ? "#4a4a70" : "#2a2a40",
                            lineHeight: 1.3,
                          }}
                        >
                          {prev
                            ? Number(prev.weight) === 0
                              ? `${prev.reps}r`
                              : `${prev.weight}×${prev.reps}`
                            : "—"}
                        </div>
                        <div
                          style={{ display: "flex", justifyContent: "center" }}
                        >
                          <div
                            onClick={() => toggleLogged(w.id, s.id)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: `2px solid ${s.logged ? "#dc2626" : "#2a2020"}`,
                              background: s.logged ? "#dc2626" : "transparent",
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
                    );
                  })}

                  {/* Add/remove set */}
                  <div style={{ padding: "8px 14px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => addSet(w.id)}
                      style={{
                        fontSize: 11,
                        color: "#9f1239",
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
                  background: "linear-gradient(135deg, #7f1d1d, #991b1b)",
                  border: "1px solid #dc2626",
                  borderRadius: 12,
                  color: "#fca5a5",
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
                  background: "#1a0a0a",
                  border: "1px solid #991b1b",
                  borderRadius: 12,
                  padding: 18,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#f87171",
                    fontWeight: 700,
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  {DAYS[activeDay].toUpperCase()} WEEK {activeWeek + 1} COMPLETE
                </div>

                {/* Workout Summary */}
                {workoutSummary && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 24,
                      margin: "12px 0",
                      padding: "10px 0",
                      borderTop: "1px solid #450a0a",
                      borderBottom: "1px solid #450a0a",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171" }}>
                        {workoutSummary.sets}
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: 2, color: "#555570" }}>SETS</div>
                    </div>
                    {workoutSummary.volume > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171" }}>
                          {workoutSummary.volume >= 1000
                            ? `${(workoutSummary.volume / 1000).toFixed(1)}k`
                            : workoutSummary.volume}
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "#555570" }}>VOLUME</div>
                      </div>
                    )}
                    {workoutSummary.durationMin > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171" }}>
                          {workoutSummary.durationMin}m
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: 2, color: "#555570" }}>DURATION</div>
                      </div>
                    )}
                  </div>
                )}

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
                {isLastWeekAllDone && (
                  <div style={{ marginTop: 16, borderTop: "1px solid #2a1414", paddingTop: 16 }}>
                    <div style={{ fontSize: 11, color: "#fca5a5", marginBottom: 8, letterSpacing: 1 }}>
                      🎉 ALL {TOTAL_WEEKS} WEEKS COMPLETE!
                    </div>
                    <button
                      onClick={copyLastWeekToNewPlan}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "linear-gradient(135deg, #7f1d1d, #991b1b)",
                        border: "1px solid #dc2626",
                        borderRadius: 10,
                        color: "#fca5a5",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 2,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ↻ COPY WEEK {TOTAL_WEEKS} → NEW PLAN
                    </button>
                    <div style={{ fontSize: 10, color: "#555570", marginTop: 6 }}>
                      Starts a fresh {TOTAL_WEEKS}-week plan using Week {TOTAL_WEEKS}'s workouts as the new baseline
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  background: "#0d0d0d",
  border: "1px solid #2a2020",
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
const ghostBtn = {
  background: "none",
  border: "1px solid #2a2020",
  color: "#4a2020",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "inherit",
};
const iconBtn = {
  background: "none",
  border: "none",
  color: "#6a3a3a",
  cursor: "pointer",
  fontSize: 15,
  padding: "2px 6px",
  lineHeight: 1,
  fontFamily: "inherit",
};
const colHeader = {
  fontSize: 10,
  letterSpacing: 2,
  color: "#443030",
  fontWeight: 600,
  textAlign: "center" as const,
};
