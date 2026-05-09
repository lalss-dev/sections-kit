// SwarmRevealOverlay — tile-mosaic reveal. Each particle's element is
// natively sized at exactly one grid cell of the section (width
// 100/COLS%, height 100/ROWS%, positioned at its row/col origin).
// During flight it's scaled down to a tiny dot via `transform: scale(...)`
// and translated to a spawn offset; on arrival it scales back to 1
// (filling its cell precisely as a tile); during the dissolve phase
// the tile fades in stagger order, revealing the page underneath
// tile-by-tile.
//
// 1 particle = 1 exact tile of the page. Tiles align perfectly to a
// 14×9 grid because their position/size are percentages of the
// section, not fixed px scaled by approximation.
//
// Hosts call this conditionally when section.reveal === "swarm" so
// the DOM cost only hits sections that opted in.

const COLS = 14;
const ROWS = 9;
const SWARM_COUNT = COLS * ROWS;

export type SwarmSeed = {
  // Cell origin as % of section. Element's top/left + width/height
  // make the natural box exactly equal to one grid cell.
  dxPercent: number;
  dyPercent: number;
  widthPercent: number;
  heightPercent: number;
  // Flight offset in vmin (relative to cell center via transform-origin
  // 50% 50%).
  sx: string;
  sy: string;
  mx: string;
  my: string;
  // Visual scale during flight — a tiny fraction so the cell-sized
  // element looks like a small dot. Slight per-particle variation.
  flightScale: number;
  rotateStart: number;
  // Multiplier on motion-dur for animation-delay. Range 0..2 — wide
  // stagger so different cells are at different phases of their
  // build/dissolve cycle at any frame.
  delayFactor: number;
};

// Deterministic seed list so SSR + client renders match.
export const SWARM_SEEDS: SwarmSeed[] = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;

  // Cell-aligned destination — no jitter, so tiles tile perfectly.
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const widthPercent = 100 / COLS;
  const heightPercent = 100 / ROWS;
  const dxPercent = col * widthPercent;
  const dyPercent = row * heightPercent;

  // Spawn 45-80vmin from destination at random angle.
  const angle = r(3) * Math.PI * 2;
  const spawnDist = 45 + r(4) * 35;
  const sxNum = Math.cos(angle) * spawnDist;
  const syNum = Math.sin(angle) * spawnDist;

  // Gentle curve via perpendicular waypoint.
  const curveSign = r(5) > 0.5 ? 1 : -1;
  const curveAmount = spawnDist * 0.18 * curveSign;
  const mxNum = sxNum * 0.5 + -Math.sin(angle) * curveAmount;
  const myNum = syNum * 0.5 + Math.cos(angle) * curveAmount;

  // 0.04..0.08 visual scale during flight — produces a tiny dot
  // regardless of section size.
  const flightScale = 0.04 + r(7) * 0.04;

  // Rotation: spins 180-540° during flight, lands at 0.
  const rotSign = r(8) > 0.5 ? 1 : -1;
  const rotateStart = (180 + r(2) * 360) * rotSign;

  // Wide per-particle delay multiplier (0..2 motion-dur). Each
  // particle's full flight→grow→hold→dissolve cycle is shifted
  // along the total timeline by `delayFactor * motion-dur`, so at
  // any frame different cells are at very different phases. This
  // is what produces the "puzzle 30% built / 70% still waiting"
  // moment Bilal asked for. Small narrow stagger (the old 0-450ms)
  // made every cell dissolve nearly together = looked like a fade.
  const delayFactor = r(6) * 2;

  return {
    dxPercent,
    dyPercent,
    widthPercent,
    heightPercent,
    sx: `${sxNum}vmin`,
    sy: `${syNum}vmin`,
    mx: `${mxNum}vmin`,
    my: `${myNum}vmin`,
    flightScale,
    rotateStart,
    delayFactor,
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
            top: `${s.dyPercent}%`,
            left: `${s.dxPercent}%`,
            width: `${s.widthPercent}%`,
            height: `${s.heightPercent}%`,
            ["--sx" as never]: s.sx,
            ["--sy" as never]: s.sy,
            ["--mx" as never]: s.mx,
            ["--my" as never]: s.my,
            ["--p-flight-scale" as never]: `${s.flightScale}`,
            ["--p-rot-start" as never]: `${s.rotateStart}deg`,
            // Wide stagger expressed as a multiple of motion-dur so
            // it scales with the speed knob.
            animationDelay: `calc(var(--skit-motion-dur, 700ms) * ${s.delayFactor})`,
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
    span.style.top = `${s.dyPercent}%`;
    span.style.left = `${s.dxPercent}%`;
    span.style.width = `${s.widthPercent}%`;
    span.style.height = `${s.heightPercent}%`;
    span.style.setProperty("--sx", s.sx);
    span.style.setProperty("--sy", s.sy);
    span.style.setProperty("--mx", s.mx);
    span.style.setProperty("--my", s.my);
    span.style.setProperty("--p-flight-scale", `${s.flightScale}`);
    span.style.setProperty("--p-rot-start", `${s.rotateStart}deg`);
    span.style.animationDelay = `calc(var(--skit-motion-dur, 700ms) * ${s.delayFactor})`;
    host.appendChild(span);
    return span;
  });

  return () => {
    for (const s of spans) {
      if (s.parentNode === host) host.removeChild(s);
    }
  };
}
