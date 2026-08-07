import React from 'react';
import { Inbox } from 'lucide-react';
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
 */
const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', hint, action, className }) => (
  <div className={cn('flex flex-col items-center px-4 py-10 text-center', className)}>
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-surface-2">
      <Icon size={20} strokeWidth={1.75} className="text-tertiary" aria-hidden="true" />
    </div>
    <p className="text-base font-semibold text-primary">{title}</p>
    {hint && <p className="mt-1 max-w-[38ch] text-sm text-secondary">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
