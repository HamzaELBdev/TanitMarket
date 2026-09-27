"use client";

export function OrDivider({ t }) {
  return (
    <div className="flex items-center gap-4" role="separator" aria-label={t('authOrEmail')}>
      <span className="h-px flex-1 bg-[#e0e6da]" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]" aria-hidden="true">
        {t('authOrEmail')}
      </span>
      <span className="h-px flex-1 bg-[#e0e6da]" />
    </div>
  );
}

/** "Pas encore de compte ? Créer un compte" — switches the view in place. */
export function SwitchPrompt({ question, action, onClick }) {
  return (
    <p className="text-center text-[15px] text-[#454745]">
      {question}{' '}
      <button type="button" onClick={onClick}
        className="min-h-11 px-1 font-semibold text-brand-forest underline underline-offset-4 decoration-[#a9b6a0]
          hover:decoration-brand-forest cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-moss">
        {action}
      </button>
    </p>
  );
}
