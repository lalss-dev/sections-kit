// Butterflies — dozens of small SVG butterflies fluttering across
// the page. Each butterfly has its own random spawn + speed + size +
// color via inline custom properties; CSS keyframes do the wing flap
// + drift. Pure CSS, no JS, low cost (24 elements, all transform-only
// animations).

// Page-level butterflies are AMBIENT, not the showcase. Bilal: "page
// effect make that too but minimal only that won't bother reading
// experience." Halved the count + lowered opacity in CSS so they're
// background mood, not distraction. The premium "thousand butterfly
// become one" is a per-section REVEAL effect (swarm reveal), not
// this.
const COUNT = 12;

// Pre-rolled random seeds so re-renders give the same butterfly
// pattern (avoids hydration mismatch).
const SEEDS = Array.from({ length: COUNT }, (_, i) => {
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  return {
    left: r(1) * 100,             // %
    top: r(2) * 100,              // %
    size: 16 + Math.floor(r(3) * 22), // 16..38px
    delay: -Math.floor(r(4) * 8),  // negative = mid-animation on mount
    dur: 7 + r(5) * 8,             // 7..15s drift
    flap: 0.18 + r(6) * 0.18,      // 0.18..0.36s flap
    hue: Math.floor(r(7) * 360),   // 0..360
  };
});

export function Butterflies() {
  return (
    <div className="skit-fx-butterflies" aria-hidden>
      {SEEDS.map((s, i) => (
        <span
          key={i}
          className="skit-fx-butterfly"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            ["--skit-fx-bf-size" as never]: `${s.size}px`,
            ["--skit-fx-bf-delay" as never]: `${s.delay}s`,
            ["--skit-fx-bf-dur" as never]: `${s.dur}s`,
            ["--skit-fx-bf-flap" as never]: `${s.flap}s`,
            ["--skit-fx-bf-hue" as never]: `${s.hue}`,
          }}
        >
          <svg viewBox="0 0 40 40" className="skit-fx-bf-svg">
            <g className="skit-fx-bf-wings">
              {/* left wing */}
              <path d="M20 20 Q4 8 6 22 Q10 30 20 22 Z" className="skit-fx-bf-wing skit-fx-bf-wing-l" />
              {/* right wing */}
              <path d="M20 20 Q36 8 34 22 Q30 30 20 22 Z" className="skit-fx-bf-wing skit-fx-bf-wing-r" />
            </g>
            {/* body */}
            <ellipse cx="20" cy="22" rx="1" ry="6" className="skit-fx-bf-body" />
          </svg>
        </span>
      ))}
    </div>
  );
}
