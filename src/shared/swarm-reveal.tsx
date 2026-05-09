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

const SWARM_COUNT = 30;

const SEEDS = Array.from({ length: SWARM_COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  // Random off-section position. Use vmin so the spawn radius scales
  // with viewport — desktop spawns wider, mobile keeps it tight.
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
      {SEEDS.map((s, i) => (
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
