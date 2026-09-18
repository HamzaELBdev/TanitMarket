"use client";
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = [
  { n: 1, label: 'Catégorie' },
  { n: 2, label: 'Détails' },
  { n: 3, label: 'Photos' },
  { n: 4, label: 'Prix' },
];

/**
 * 4-step progress indicator: numbered circles connected by a fill line,
 * checkmark once a step is behind the current one. Steps only become
 * clickable once `canReach(n)` says the earlier steps are valid, mirroring
 * the wizard's own forward-validation rules.
 */
export default function StepProgress({ currentStep, canReach, onStepClick }) {
  return (
    <div className="flex items-center" role="tablist" aria-label="Étapes de publication">
      {STEPS.map((step, idx) => {
        const isDone = step.n < currentStep;
        const isActive = step.n === currentStep;
        const reachable = canReach(step.n);
        return (
          <React.Fragment key={step.n}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Étape ${step.n} : ${step.label}`}
              disabled={!reachable}
              onClick={() => reachable && onStepClick(step.n)}
              className={cn(
                'flex flex-col items-center gap-1.5 min-w-11 shrink-0 group',
                reachable ? 'cursor-pointer' : 'cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 shrink-0',
                  isActive
                    ? 'bg-[#0e0f0c] text-[#9FE870] shadow-md scale-110'
                    : isDone
                    ? 'bg-[#9FE870] text-[#0e0f0c]'
                    : reachable
                    ? 'bg-[#e8ebe6] text-[#454745] group-hover:bg-[#dde1d9]'
                    : 'bg-[#e8ebe6] text-[#868685]/50'
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : step.n}
              </span>
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] font-bold whitespace-nowrap',
                  isActive ? 'text-[#0e0f0c]' : 'text-[#868685]'
                )}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <span
                className={cn(
                  'flex-1 h-1 rounded-full mx-1 sm:mx-2 -mt-4 transition-colors duration-300',
                  step.n < currentStep ? 'bg-[#9FE870]' : 'bg-[#e8ebe6]'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
