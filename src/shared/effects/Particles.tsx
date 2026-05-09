// Particles — soft floating dots drifting across the page. Same
// shape as Butterflies (deterministic seeds, CSS-only animations)
// but more particles, smaller, slower drift. Reads as ambient
// atmosphere without dominating the page like aurora does.

const COUNT = 60;

const SEEDS = Array.from({ length: COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  return {
    left: r(1) * 100,                  // %
    top: r(2) * 100,                   // %
    size: 2 + Math.floor(r(3) * 5),    // 2..7px
    delay: -Math.floor(r(4) * 12),     // start mid-animation
    dur: 12 + r(5) * 16,                // 12..28s drift
    opacity: 0.25 + r(6) * 0.4,         // 0.25..0.65
  };
});

export function Particles() {
  return (
    <div className="skit-fx-particles" aria-hidden>
      {SEEDS.map((s, i) => (
        <span
          key={i}
          className="skit-fx-particle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            ["--skit-fx-p-delay" as never]: `${s.delay}s`,
            ["--skit-fx-p-dur" as never]: `${s.dur}s`,
            ["--skit-fx-p-opacity" as never]: `${s.opacity}`,
          }}
        />
      ))}
    </div>
  );
}
