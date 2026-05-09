// SwarmRevealOverlay — premium reveal helper. Renders ~30 SVG
// butterflies as absolute children of the section wrapper. Each
// butterfly has random `--sx` / `--sy` / `--sr` (offset + rotation)
// custom properties baked into inline style; CSS keyframes in
// reveal.css drive them from those random off-section positions to
// (0, 0) while shrinking + fading. The result is "thousand butterfly
// converge into one".
//
// Hosts call this conditionally when section.reveal === "swarm" so
// the DOM cost only hits sections that opted in.
//
// SWARM_SEEDS + spawnSwarmButterflies are also exported so the editor
// (motion.ts → playRevealPreview / playSwarmDemo) can spawn the same
// shapes via plain DOM during chip-pick demos.

const SWARM_COUNT = 30;

export type SwarmSeed = {
  sx: string;
  sy: string;
  sr: string;
  hue: number;
  size: number;
  delay: number;
};

// Deterministic seed list so SSR + client renders match. The math is
// a cheap LCG-style hash keyed off the index — fine for visual variety.
export const SWARM_SEEDS: SwarmSeed[] = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  // Random off-section position. vmin so spawn radius scales with
  // viewport — desktop spawns wider, mobile keeps it tight.
  const angle = r(1) * Math.PI * 2;
  const dist = 28 + r(2) * 32; // 28..60 vmin from center
  return {
    sx: `${Math.cos(angle) * dist}vmin`,
    sy: `${Math.sin(angle) * dist}vmin`,
    sr: `${(r(3) - 0.5) * 720}deg`,        // -360..+360 rotation
    hue: Math.floor(r(4) * 360),            // wing color
    size: 18 + Math.floor(r(5) * 16),       // 18..34 px
    delay: r(6) * 0.5,                      // 0..500ms stagger
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
            ["--sr" as never]: s.sr,
            ["--skit-fx-bf-hue" as never]: `${s.hue}`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            marginLeft: `${-s.size / 2}px`,
            marginTop: `${-s.size / 2}px`,
            animationDelay: `${s.delay}s`,
          }}
        >
          <svg viewBox="0 0 40 40" width="100%" height="100%">
            <g className="skit-reveal-swarm-wings">
              <path
                d="M20 20 Q4 8 6 22 Q10 30 20 22 Z"
                fill={`hsl(${s.hue}, 80%, 65%)`}
              />
              <path
                d="M20 20 Q36 8 34 22 Q30 30 20 22 Z"
                fill={`hsl(${s.hue}, 80%, 65%)`}
              />
            </g>
            <ellipse cx="20" cy="22" rx="1" ry="6" fill={`hsl(${s.hue}, 30%, 18%)`} />
          </svg>
        </span>
      ))}
    </>
  );
}

// Plain-DOM butterfly spawn — used by the editor chip-pick demo where
// React mounting isn't available (we're animating an arbitrary section
// node in the live DOM). Returns a cleanup that removes the spawned
// nodes. Does NOT trigger the animation — caller handles that
// (typically by toggling .skit-reveal-swarm + .in-view, or running
// WAAPI per-particle).
export function spawnSwarmButterflies(host: HTMLElement): () => void {
  if (typeof document === "undefined") return () => {};
  const SVG_NS = "http://www.w3.org/2000/svg";
  const spans: HTMLSpanElement[] = SWARM_SEEDS.map((s) => {
    const span = document.createElement("span");
    span.className = "skit-reveal-swarm-particle";
    span.style.setProperty("--sx", s.sx);
    span.style.setProperty("--sy", s.sy);
    span.style.setProperty("--sr", s.sr);
    span.style.width = `${s.size}px`;
    span.style.height = `${s.size}px`;
    span.style.marginLeft = `${-s.size / 2}px`;
    span.style.marginTop = `${-s.size / 2}px`;
    span.style.animationDelay = `${s.delay}s`;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "skit-reveal-swarm-wings");
    const wL = document.createElementNS(SVG_NS, "path");
    wL.setAttribute("d", "M20 20 Q4 8 6 22 Q10 30 20 22 Z");
    wL.setAttribute("fill", `hsl(${s.hue}, 80%, 65%)`);
    const wR = document.createElementNS(SVG_NS, "path");
    wR.setAttribute("d", "M20 20 Q36 8 34 22 Q30 30 20 22 Z");
    wR.setAttribute("fill", `hsl(${s.hue}, 80%, 65%)`);
    g.appendChild(wL);
    g.appendChild(wR);
    const body = document.createElementNS(SVG_NS, "ellipse");
    body.setAttribute("cx", "20");
    body.setAttribute("cy", "22");
    body.setAttribute("rx", "1");
    body.setAttribute("ry", "6");
    body.setAttribute("fill", `hsl(${s.hue}, 30%, 18%)`);
    svg.appendChild(g);
    svg.appendChild(body);

    span.appendChild(svg);
    host.appendChild(span);
    return span;
  });

  return () => {
    for (const s of spans) {
      if (s.parentNode === host) host.removeChild(s);
    }
  };
}
