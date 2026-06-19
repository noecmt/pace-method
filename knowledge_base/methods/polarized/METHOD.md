# Polarized — method pack

**Principle.** Polarized training splits intensity sharply: most of the week is genuinely easy, a small slice is genuinely hard, and the middle is deliberately avoided. The Planner draws its near-window sessions from `session_structures.csv` and biases the weekly distribution accordingly — it never invents structure beyond what the catalog and the phase rules allow.

**Intensity distribution (~80/20).**

- **~80%** of training time at low intensity (Z1-Z2) — fully conversational, aerobic.
- **~20%** at high intensity (Z4-Z5) — threshold and VO2max stimulus.
- **Minimal Z3** — the "no man's land": too hard to be easy, too easy to be a real stimulus. Polarized avoids accumulating time here.

The hard ~20% is expressed in the **build** phase, where Z4-Z5 are legal. In **base** (where `periodization-rules.csv` forbids Z4-Z5), the only intensity touch is a limited dose of Z3/sweet-spot — polarized keeps it deliberately small. Taper, race and recovery stay Z1-Z2 per the phase rules, untouched by the method.

**Who it suits.**

- Endurance athletes with the time to protect a large easy-volume base (typically ≥ 6 h/week).
- Athletes who tend to ride "moderately hard all the time" and stall — polarization breaks that trap.
- Build phases aimed at raising threshold and VO2max without chronic fatigue.

**Contraindications / when not to use.**

- Very low weekly volume (the 80% easy block becomes too small to matter) — a more time-efficient distribution may serve better.
- Phases that structurally exclude high intensity (taper, race week, recovery): the polarization collapses to easy volume by design; that is expected, not a failure.
- An athlete carrying unresolved fatigue or injury: the hard 20% is a real stressor — resolve the constraint first.

**Conformance.** This pack restricts *how* the plan distributes intensity; it never overrides `periodization-rules.csv`. Every session in `session_structures.csv` is phase-legal; the Planner's deterministic phase check (`plan-write.md`, step 3) remains authoritative.
