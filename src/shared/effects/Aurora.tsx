// Aurora — flowing iridescent gradient bg. Three large soft color
// blobs that drift across the page on independent CSS animations,
// blended together via filter:blur. Pure CSS, no JS, GPU-composited
// (transform-only). Sits BEHIND content (z-index: 0) and over the
// page bg, so authors see their existing bg tinted by the aurora.

export function Aurora() {
  return (
    <div className="skit-fx-aurora" aria-hidden>
      <span className="skit-fx-aurora-blob skit-fx-aurora-blob-a" />
      <span className="skit-fx-aurora-blob skit-fx-aurora-blob-b" />
      <span className="skit-fx-aurora-blob skit-fx-aurora-blob-c" />
    </div>
  );
}
