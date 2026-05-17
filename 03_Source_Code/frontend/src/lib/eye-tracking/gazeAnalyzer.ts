export type GazePoint = { x: number; y: number; t: number };
export type EventType = 'fixation' | 'saccade' | 'regression' | 'distract' | 'face-lost';
export type GazeEvent = {
  type: EventType;
  timestamp: number;
  duration?: number;
  details?: Record<string, unknown>;
};

export class GazeAnalyzer {
  private history: GazePoint[] = [];
  private fixations: { x: number; y: number; start: number; end?: number }[] = [];
  private lastFaceSeenAt: number = Date.now();

  private fixationRadius = 0.03;
  private minFixationDuration = 120;
  private saccadeVelocityThreshold = 0.9;
  private regressionXThreshold = 0.04;
  private distractTimeout = 700;

  constructor() {}

  notifyFaceLost() {
    this.lastFaceSeenAt = 0;
  }

  notifyFaceSeen() {
    this.lastFaceSeenAt = Date.now();
  }

  process(
    p: { x: number; y: number; t?: number },
    readingArea?: { x: number; y: number; w: number; h: number }
  ): GazeEvent[] {
    const t = p.t ?? Date.now();
    const gp: GazePoint = { x: p.x, y: p.y, t };
    this.history.push(gp);

    const cutoff = t - 3000;
    this.history = this.history.filter((h) => h.t >= cutoff);

    const events: GazeEvent[] = [];

    if (this.lastFaceSeenAt === 0) {
      events.push({ type: 'face-lost', timestamp: t });
      return events;
    }

    if (readingArea) {
      const inside =
        gp.x >= readingArea.x &&
        gp.x <= readingArea.x + readingArea.w &&
        gp.y >= readingArea.y &&
        gp.y <= readingArea.y + readingArea.h;

      if (!inside) {
        let lastInside = 0;
        for (let i = this.history.length - 1; i >= 0; i--) {
          const h = this.history[i];
          if (
            h.x >= readingArea.x &&
            h.x <= readingArea.x + readingArea.w &&
            h.y >= readingArea.y &&
            h.y <= readingArea.y + readingArea.h
          ) {
            lastInside = h.t;
            break;
          }
        }
        if (lastInside === 0) lastInside = cutoff;
        const outsideDuration = t - lastInside;
        if (outsideDuration >= this.distractTimeout) {
          events.push({ type: 'distract', timestamp: t, details: { outsideDuration } });
          this.history = [];
          return events;
        }
      }
    }

    if (this.history.length >= 2) {
      const a = this.history[this.history.length - 2];
      const b = this.history[this.history.length - 1];
      const dt = (b.t - a.t) / 1000;
      if (dt > 0) {
        const vx = (b.x - a.x) / dt;
        const vy = (b.y - a.y) / dt;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed >= this.saccadeVelocityThreshold) {
          events.push({ type: 'saccade', timestamp: t, details: { speed } });
        }
      }
    }

    const winT = 600;
    const win = this.history.filter((h) => h.t >= t - winT);
    if (win.length >= 4) {
      const xs = win.map((w) => w.x);
      const ys = win.map((w) => w.y);
      const dx = Math.max(...xs) - Math.min(...xs);
      const dy = Math.max(...ys) - Math.min(...ys);
      const radius = Math.max(dx, dy);
      const duration = win[win.length - 1].t - win[0].t;
      if (radius <= this.fixationRadius && duration >= this.minFixationDuration) {
        const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
        const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;
        const lastFix = this.fixations[this.fixations.length - 1];
        let isNew = true;
        if (lastFix && Math.hypot(lastFix.x - centerX, lastFix.y - centerY) <= this.fixationRadius) {
          lastFix.end = t;
          isNew = false;
        } else {
          this.fixations.push({ x: centerX, y: centerY, start: win[0].t, end: t });
        }
        if (isNew) {
          events.push({
            type: 'fixation',
            timestamp: t,
            duration,
            details: { x: centerX, y: centerY },
          });

          const fi = this.fixations;
          if (fi.length >= 2) {
            const prev = fi[fi.length - 2];
            const curr = fi[fi.length - 1];
            if (curr.x < prev.x - this.regressionXThreshold) {
              events.push({
                type: 'regression',
                timestamp: t,
                details: { from: prev.x, to: curr.x, delta: prev.x - curr.x },
              });
            }
          }
        }
      }
    }

    return events;
  }

  reset() {
    this.history = [];
    this.fixations = [];
    this.lastFaceSeenAt = Date.now();
  }
}