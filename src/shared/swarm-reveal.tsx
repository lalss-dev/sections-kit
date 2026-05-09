// SwarmRevealOverlay — premium reveal helper. Renders ~96 soft glowing
// dots distributed UNIFORMLY across the section's bounds, each
// arriving from outside via a curved arc. The section content fades
// in *behind* the swarm as particles settle into their tiled
// destinations, then particles dissolve — reads as "the page is
// being built by the swarm" rather than "bugs converging to one
// spot in the middle".
//
// How distribution works:
//   1. Section is sliced into a 12×8 = 96-cell grid.
//   2. Each particle gets one cell + jitter within that cell, so
//      destinations cover the entire section evenly without clumps.
//   3. Each particle's element has top/left set inline to its
//      destination (in % of the section).
//   4. CSS keyframes drive transform from spawn offset → curved
//      midpoint → translate(0,0) (which IS the destination).
//
// Hosts call this conditionally when section.reveal === "swarm" so
// the DOM cost only hits sections that opted in. SWARM_SEEDS +
// spawnSwarmParticles are also exported so the editor (motion.ts →
// playRevealPreview / playSwarmDemo) can spawn the same shapes via
// plain DOM during chip-pick demos.

const COLS = 12;
const ROWS = 8;
const SWARM_COUNT = COLS * ROWS;

export type SwarmSeed = {
  sx: string;        // spawn offset x relative to destination (vmin)
  sy: string;        // spawn offset y relative to destination (vmin)
  mx: string;        // curved-arc midpoint offset x (vmin)
  my: string;        // curved-arc midpoint offset y (vmin)
  dxPercent: number; // destination x as % of section width
  dyPercent: number; // destination y as % of section height
  size: number;      // px (3..6)
  opacity: number;   // peak opacity (0..1)
  delay: number;     // seconds — small per-particle stagger
};

// Deterministic seed list so SSR + client renders match. The math is
// a cheap LCG-style hash keyed off the index — fine for visual variety.
export const SWARM_SEEDS: SwarmSeed[] = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;

  // GRID-WITH-JITTER destination: each particle owns one cell of the
  // 12×8 grid; jitter inside the cell prevents the grid pattern from
  // being visible. 5-95% range so dots aren't clipped at the edges.
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const dxPercent = 5 + ((col + r(1)) / COLS) * 90;
  const dyPercent = 5 + ((row + r(2)) / ROWS) * 90;

  // Spawn at random angle 50-90vmin from the destination — far enough
  // off-section that the swarm reads as "coming from outside" before
  // settling.
  const angle = r(3) * Math.PI * 2;
  const spawnDist = 50 + r(4) * 40;
  const sxNum = Math.cos(angle) * spawnDist;
  const syNum = Math.sin(angle) * spawnDist;

  // Curved arc: midpoint is at the linear midway (sx*0.5, sy*0.5)
  // PLUS an offset perpendicular to the spawn vector. The
  // perpendicular unit is (-sin θ, cos θ); curve amount is ~30% of
  // spawn distance, with random sign so half particles swirl
  // clockwise and half counter-clockwise.
  const swirlSign = r(5) > 0.5 ? 1 : -1;
  const curveAmount = spawnDist * 0.3 * swirlSign;
  const mxNum = sxNum * 0.5 + -Math.sin(angle) * curveAmount;
  const myNum = syNum * 0.5 + Math.cos(angle) * curveAmount;

  // Three brightness tiers — most dim, some medium, a few bright —
  // so the swarm has visual depth instead of feeling flat.
  const brightnessRoll = r(6);
  const opacity =
    brightnessRoll < 0.55 ? 0.45 :
    brightnessRoll < 0.85 ? 0.7 :
                           0.95;

  return {
    sx: `${sxNum}vmin`,
    sy: `${syNum}vmin`,
    mx: `${mxNum}vmin`,
    my: `${myNum}vmin`,
    dxPercent,
    dyPercent,
    size: 3 + Math.floor(r(7) * 4),  // 3..6 px
    opacity,
    delay: r(8) * 0.45,               // 0..450ms stagger
  };
});

export function SwarmRevealOverlay() {
  return (
    <>
      {SWARM_SEEDS.map((s, i) => (
        <span
          key={i}
          className="skit-reveal-swarm-particle"
          style={{
            ["--sx" as never]: s.sx,
            ["--sy" as never]: s.sy,
            ["--mx" as never]: s.mx,
            ["--my" as never]: s.my,
            ["--p-opacity" as never]: `${s.opacity}`,
            top: `${s.dyPercent}%`,
            left: `${s.dxPercent}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            marginLeft: `${-s.size / 2}px`,
            marginTop: `${-s.size / 2}px`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </>
  );
}

// Plain-DOM particle spawn — used by the editor chip-pick demo where
// React mounting isn't available. Returns a cleanup that removes the
// spawned nodes.
export function spawnSwarmParticles(host: HTMLElement): () => void {
  if (typeof document === "undefined") return () => {};
  const spans: HTMLSpanElement[] = SWARM_SEEDS.map((s) => {
    const span = document.createElement("span");
    span.className = "skit-reveal-swarm-particle";
    span.style.setProperty("--sx", s.sx);
    span.style.setProperty("--sy", s.sy);
    span.style.setProperty("--mx", s.mx);
    span.style.setProperty("--my", s.my);
    span.style.setProperty("--p-opacity", `${s.opacity}`);
    span.style.top = `${s.dyPercent}%`;
    span.style.left = `${s.dxPercent}%`;
    span.style.width = `${s.size}px`;
    span.style.height = `${s.size}px`;
    span.style.marginLeft = `${-s.size / 2}px`;
    span.style.marginTop = `${-s.size / 2}px`;
    span.style.animationDelay = `${s.delay}s`;
    host.appendChild(span);
    return span;
  });

  return () => {
    for (const s of spans) {
      if (s.parentNode === host) host.removeChild(s);
    }
  };
}
