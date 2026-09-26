// Central design + motion tokens for the marketplace UI.
// Colors mirror tailwind.config.js (`brand.*`) and the --tm-* CSS variables in
// app/globals.css — use the Tailwind classes in markup, and these values only
// where JS needs them (inline styles, motion props).

export const COLORS = {
  forest: '#163300',
  lime: '#9FE870',
  mint: '#EDF8E7',
  hero: '#EFF5E9',
  moss: '#5A7C44',
};

// Durations in seconds (motion) — micro-interactions 150–250ms, entrances 350–550ms.
export const DURATION = {
  micro: 0.2,
  enter: 0.45,
};

export const EASE_OUT = [0.22, 1, 0.36, 1];

// Max stagger between siblings — kept short so listings stay immediately usable.
export const STAGGER = 0.05;

export const SPRING_TAP = { type: 'spring', stiffness: 500, damping: 30 };

// Entrance: fade + 16px rise. Under MotionConfig reducedMotion="user" the
// transform is dropped automatically and only the opacity fade remains.
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.enter, ease: EASE_OUT } },
};

export const staggerContainer = (stagger = STAGGER, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Shared hover/tap feedback for buttons and tiles.
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: { duration: DURATION.micro, ease: EASE_OUT },
};

// Viewport options for one-time section reveals.
export const REVEAL_VIEWPORT = { once: true, amount: 0.15 };
