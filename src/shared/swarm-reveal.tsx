// SwarmRevealOverlay — premium reveal helper. Renders ~80 soft glowing
// dots as absolute children of the section wrapper. Each dot has random
// `--sx`/`--sy` (spawn offset) AND `--mx`/`--my` (curved-arc midpoint)
// custom properties baked into inline style; CSS keyframes in
// reveal.css drive them through the midpoint to (0, 0) — a curved
// path that reads as a "swarm" instead of straight-line laser beams.
//
// Visual is intentionally restrained: warm-white core with a layered
// gold box-shadow halo, three brightness tiers per particle for depth,
// no cartoon shapes. Style references "Plankton" and "Particles Write
// Text" — premium swarm reveals win on subtlety, not character.
//
// Hosts call this conditionally when section.reveal === "swarm" so
// the DOM cost only hits sections that opted in.
//
// SWARM_SEEDS + spawnSwarmParticles are also exported so the editor
// (motion.ts → playRevealPreview / playSwarmDemo) can spawn the same
// shapes via plain DOM during chip-pick demos.

const SWARM_COUNT = 80;

export type SwarmSeed = {
  sx: string;     // spawn x (vmin)
  sy: string;     // spawn y (vmin)
  mx: string;     // mid-arc x (vmin) — offset perpendicular to spawn→center for curved motion
  my: string;     // mid-arc y (vmin)
  size: number;   // px
  opacity: number; // peak opacity (0..1)
  delay: number;  // seconds
};

// Deterministic seed list so SSR + client renders match. The math is
// a cheap LCG-style hash keyed off the index — fine for visual variety.
export const SWARM_SEEDS: SwarmSeed[] = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  // Spawn at 30-70vmin from center at a random angle. vmin so spawn
  // radius scales with viewport — desktop spawns wider, mobile keeps
  // it tight.
  const angle = r(1) * Math.PI * 2;
  const dist = 30 + r(2) * 40;
  // Curved arc: midpoint is at ~55% of the spawn distance but offset
  // ±60-90° perpendicular to the spawn-center line. This makes the
  // particle trace a curve through mid-flight before settling at
  // center, not a boring straight line. Half the particles swirl
  // clockwise, half counter-clockwise.
  const swirlSign = r(3) > 0.5 ? 1 : -1;
  const swirlAngle = angle + swirlSign * (Math.PI / 4 + r(4) * (Math.PI / 4));
  const midDist = dist * (0.45 + r(5) * 0.2);
  // Three brightness tiers — most dim, some medium, a few bright — so
  // the swarm has visual depth instead of feeling flat.
  const brightnessRoll = r(6);
  const opacity =
    brightnessRoll < 0.55 ? 0.45 :   // dim majority
    brightnessRoll < 0.85 ? 0.7 :    // medium accent
                           0.95;     // bright highlights
  return {
    sx: `${Math.cos(angle) * dist}vmin`,
    sy: `${Math.sin(angle) * dist}vmin`,
    mx: `${Math.cos(swirlAngle) * midDist}vmin`,
    my: `${Math.sin(swirlAngle) * midDist}vmin`,
    size: 3 + Math.floor(r(7) * 4),  // 3..6 px
    opacity,
    delay: r(8) * 0.4,                // 0..400ms stagger
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
// React mounting isn't available (we're animating an arbitrary section
// node in the live DOM). Returns a cleanup that removes the spawned
// nodes. Does NOT trigger the animation — caller handles that
// (typically by toggling .skit-reveal-swarm + .in-view, or running
// WAAPI per-particle).
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
