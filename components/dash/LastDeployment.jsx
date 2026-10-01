"use client";
import React, { useState, useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { formatBuildDate, formatBuildAge, parseBuildTime } from '@/lib/buildInfo';

/**
 * When the live build was produced, and which commit it came from, so an admin
 * can tell whether what they are looking at includes a change that was just
 * shipped.
 *
 * Both values are inlined at build time by next.config.js. They are read as
 * direct `process.env.X` references on purpose: destructuring process.env does
 * not survive the build-time substitution.
 */
export default function LastDeployment({ className = '' }) {
  const buildTime = process.env.BUILD_TIME;
  const commit = process.env.BUILD_COMMIT;

  // The age is relative to "now", so it cannot be computed during the export
  // without being wrong by however long ago the build ran. Filled in after
  // mount, and refreshed so a dashboard left open does not freeze at "il y a
  // 1 min".
  const [age, setAge] = useState(null);
  useEffect(() => {
    if (!parseBuildTime(buildTime)) return;
    const tick = () => setAge(formatBuildAge(buildTime));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [buildTime]);

  const date = formatBuildDate(buildTime);

  return (
    <div className={`px-3.5 py-2 text-[11px] leading-snug text-[#868685] ${className}`}>
      <div className="flex items-center gap-1.5 font-bold text-[#454745]">
        <Rocket className="w-3.5 h-3.5 shrink-0" />
        <span>Dernier déploiement</span>
      </div>
      {date ? (
        // The timezone differs between the build host and the viewer, so the
        // prerendered text and the first client render disagree by design.
        <time
          dateTime={buildTime}
          suppressHydrationWarning
          className="block mt-0.5 font-semibold text-[#0e0f0c]"
        >
          {date}
          {age ? <span className="font-normal text-[#868685]"> · {age}</span> : null}
        </time>
      ) : (
        <span className="block mt-0.5">Inconnu — build sans horodatage</span>
      )}
      {commit ? (
        <span className="block mt-0.5 font-mono">commit {commit}</span>
      ) : null}
    </div>
  );
}
