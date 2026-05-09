// Aggregate public surface. Subpath imports are also supported via
// package.json "exports" — prefer those for narrower trees.

export * from "./shared/motion.js";
export * from "./shared/animation/index.js";
export * from "./shared/effects/index.js";
export * from "./shared/interactive/index.js";
export { SwarmRevealOverlay } from "./shared/swarm-reveal.js";
