import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import cn from './cn';

/**
 * "Nothing here yet" placeholder for a list or panel.
 *
 * BORDERLESS BY DESIGN. The old version drew its own dashed 3xl border, which
 * double-bordered every time it was placed inside a Card — and a dashed border is
 * a placeholder cliché that encodes nothing. This is just centred content, so it
 * composes correctly whether it sits inside a Card or fills a screen.
 *
 * Copy rule: `title` says what is absent, `hint` says what will make it appear.
 * "No fixtures" / "Matches show up here once the league publishes its schedule."
 * Never apologise and never blame the user.
 *
 * `title` falls back to the translated common.no_data rather than a literal, so a
 * caller that has nothing specific to say still speaks the visitor's language.
 */
type EmptyStateProps = {
  icon?: React.ComponentType<any>;
  title?: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
} & Record<string, any>;

const EmptyState = ({ icon: Icon = Inbox, title, hint, action, className }: EmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col items-center px-4 py-10 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-surface-2">
        <Icon size={20} strokeWidth={1.75} className="text-tertiary" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-primary">{title || t('common.no_data')}</p>
      {hint && <p className="mt-1 max-w-[38ch] text-sm text-secondary">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
