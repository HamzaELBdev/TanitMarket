// Motion tokens for the /auth screens — one place to tune timings.
// Page/element entrances are CSS (.auth-rise / .auth-card in globals.css, same
// timings) so the server-rendered form is usable before hydration; these
// drive the interactive parts through framer-motion. Everything animates
// transform/opacity (plus the form container's height), and LayoutShell's
// MotionConfig reducedMotion="user" strips transforms under reduced motion.

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const DURATION = {
  micro: 0.18, // hover / press / focus feedback (150–220 ms)
  form: 0.3, // login ↔ signup swap (250–350 ms)
  enter: 0.42, // element entrances (350–500 ms)
};

export const PRESS_SCALE = 0.98;

export const microTransition = { duration: DURATION.micro, ease: EASE_OUT };
export const formTransition = { duration: DURATION.form, ease: EASE_OUT };

/** Login / signup / forgot views: cross-fade with a small horizontal nudge. */
export const viewVariants = {
  enter: (dir) => ({ opacity: 0, x: dir * 16 }),
  center: { opacity: 1, x: 0, transition: formTransition },
  exit: (dir) => ({ opacity: 0, x: dir * -16, transition: { duration: DURATION.micro, ease: EASE_OUT } }),
};

/** Inline validation, server errors and notices. */
export const messageVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  show: { opacity: 1, y: 0, height: 'auto', transition: microTransition },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.14, ease: EASE_OUT } },
};

/** Button label ↔ spinner ↔ success tick. */
export const labelVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: microTransition },
  exit: { opacity: 0, y: -8, transition: { duration: 0.12, ease: EASE_OUT } },
};
