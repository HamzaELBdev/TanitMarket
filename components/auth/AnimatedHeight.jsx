"use client";
import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { formTransition } from '@/lib/authMotion';

/**
 * Smoothly animates its height to fit its content (ResizeObserver), so
 * swapping login ↔ signup or showing an error never makes the card jump.
 * Before the first measurement it is plain auto height. The 8px inner
 * padding (cancelled by a negative margin) keeps focus rings and field halos
 * from being clipped.
 */
export default function AnimatedHeight({ children, className, style }) {
  const inner = useRef(null);
  const [height, setHeight] = useState('auto');
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      className={`-m-2 ${className || ''}`}
      style={{ ...style, overflow: 'hidden' }}
      initial={false}
      animate={{ height }}
      transition={reduce ? { duration: 0 } : formTransition}
    >
      <div ref={inner} className="p-2">{children}</div>
    </motion.div>
  );
}
