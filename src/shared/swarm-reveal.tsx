// SwarmRevealOverlay — PowerPoint-style "particle assembly" reveal.
// Each particle is a small flat shard (4-7px) that spawns far from
// its destination, flies in on a slight curve while spinning, and
// SETTLES at a unique grid-tiled destination across the section.
// The section content fades in WITH the settling particles (not
// after), so the page reads as being assembled BY the swarm —
// particles aren't decoration arriving on top of an already-reveald
// page; they're the material the page is built from.
//
// Why shards (small squares with hint of rounding) and not glowing
// orbs: orbs read as "magical decoration"; shards with rotation read
// as "pieces of the page being placed". PPT's "Particle" entrance
// uses tiny image fragments for exactly this reason.
//
// Each particle has unique:
//   - destination (12×8 grid + jitter, covers full section)
//   - spawn offset (random angle 45-80vmin from destination)
//   - mid-arc waypoint (gentle curve, not a swirl)
//   - rotation start + end (spins 180-720° during flight, lands at 0)
//   - opacity (dim majority, with bright accents for depth)
//   - delay (0-450ms wave so particles arrive in waves)

const COLS = 14;
const ROWS = 9;
const SWARM_COUNT = COLS * ROWS;

export type SwarmSeed = {
  sx: string;        // spawn offset x (vmin) relative to destination
  sy: string;        // spawn offset y (vmin)
  mx: string;        // curved-arc midpoint offset x (vmin)
  my: string;        // curved-arc midpoint offset y (vmin)
  dxPercent: number; // destination x as % of section width
  dyPercent: number; // destination y as % of section height
  size: number;      // px (4..7)
  opacity: number;   // peak opacity (0..1)
  rotateStart: number; // deg — initial rotation while flying
  delay: number;     // seconds
};

// Deterministic seed list so SSR + client renders match.
export const SWARM_SEEDS: SwarmSeed[] = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;

  // GRID-WITH-JITTER: each particle owns one cell of the 14×9 grid;
  // jitter inside cell prevents visible grid pattern. 4-96% range so
  // shards aren't clipped at edges.
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const dxPercent = 4 + ((col + r(1)) / COLS) * 92;
  const dyPercent = 4 + ((row + r(2)) / ROWS) * 92;

  // Spawn 45-80vmin from destination at random angle.
  const angle = r(3) * Math.PI * 2;
  const spawnDist = 45 + r(4) * 35;
  const sxNum = Math.cos(angle) * spawnDist;
  const syNum = Math.sin(angle) * spawnDist;

  // GENTLE curve — half the swirl amount we had before. Particles
  // should look like they're being placed deliberately, not
  // pirouetting in.
  const curveSign = r(5) > 0.5 ? 1 : -1;
  const curveAmount = spawnDist * 0.15 * curveSign;
  const mxNum = sxNum * 0.5 + -Math.sin(angle) * curveAmount;
  const myNum = syNum * 0.5 + Math.cos(angle) * curveAmount;

  // Three opacity tiers (dim majority, medium, bright accents).
  const brightnessRoll = r(6);
  const opacity =
    brightnessRoll < 0.55 ? 0.55 :
    brightnessRoll < 0.85 ? 0.75 :
                           0.95;

  // Rotation: spins 180-720° (max 2 full turns) during flight, lands
  // at 0. Random sign so half spin CW, half CCW.
  const rotSign = r(7) > 0.5 ? 1 : -1;
  const rotateStart = (180 + r(8) * 540) * rotSign;

  return {
    sx: `${sxNum}vmin`,
    sy: `${syNum}vmin`,
    mx: `${mxNum}vmin`,
    my: `${myNum}vmin`,
    dxPercent,
    dyPercent,
    size: 4 + Math.floor(r(7) * 4),  // 4..7 px
    opacity,
    rotateStart,
    delay: r(8) * 0.45,               // 0..450ms stagger wave
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
            ["--p-rot-start" as never]: `${s.rotateStart}deg`,
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

// Plain-DOM particle spawn — used by the editor chip-pick demo.
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
    span.style.setProperty("--p-rot-start", `${s.rotateStart}deg`);
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
