import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Search, ExternalLink, LogOut, ChevronDown, CornerDownLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useCapabilities } from '../../hooks/useCan';
import { ADMIN_PAGES, isAdminPathAllowed } from '../../lib/adminAccess';
import { PATH_META } from '../layout/Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import NotificationBell from '../shared/NotificationBell';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';
import cn from '../ui/cn';

/**
 * The admin portal's own header.
 *
 * WHAT IT REPLACED. The admin shell rendered the PUBLIC `Navbar` — so an operator
 * signed into the Ministry portal was looking at "Explore · Football · Basketball
 * · Volleyball · Handball · Cycling · Cricket", a row of links to the fan-facing
 * site, above the screen where they administer it. It also carried the wordmark
 * as a green pill in the middle of the bar and set every link in letterspaced
 * capitals, which is the language the public side was rebuilt out of.
 *
 * A portal header has a different job from a marketing one: say where you are,
 * let you get anywhere quickly, and stay out of the way. So: the identity on the
 * left, a search that goes places, and the account controls on the right.
 *
 * THE SEARCH JUMPS TO PAGES, AND ONLY PAGES. It filters the admin routes this
 * user is actually allowed to open — the same `ADMIN_PAGES` list that builds the
 * sidebar and that the server enforces — so it can never offer a screen that
 * would then refuse them. It deliberately does NOT pretend to search teams,
 * players or fixtures: there is no endpoint behind that, and a search box that
 * silently only matches menu items while looking like it searches your data is
 * worse than one that says what it does.
 *
 * IT IS THE REPORTER PORTAL'S BAR TOO. The reporter shell used to stack the
 * PUBLIC navbar, then a grey strip carrying a "Reporter Menu" button, then the
 * sidebar — the same three bands of chrome this component was written to
 * replace, left behind because only the admin layout was moved. Rather than
 * clone it, the two things that differ are props: `pages` (what ⌘K can jump to)
 * and `badge` (the word beside the wordmark). A reporter holds three
 * capabilities and none of them is an admin page, so passing their own four
 * routes is the only way the search can be honest for them.
 */

/** ⌘K / Ctrl-K, the shortcut every operator already has in their fingers. */
const useCommandKey = (onOpen: () => void) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpen]);
};

export type PortalPage = { path: string; label: string };

const AdminSearch = ({ pages: given }: { pages?: PortalPage[] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const capabilities = useCapabilities();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useCommandKey(() => inputRef.current?.focus());

  // Only pages this operator may open — the same list the sidebar is built from.
  // A portal that is not the admin one (the reporter's) hands its own list in,
  // because ADMIN_PAGES describes admin capabilities and a reporter holds none.
  const pages = useMemo(
    () => given ?? ADMIN_PAGES
      .filter((p: any) => isAdminPathAllowed(capabilities, p.path))
      // ADMIN_PAGES carries an English `label` for the access list; the sidebar's
      // PATH_META carries the translated one. Prefer the translation, fall back to
      // the English so a page is never unreachable just because a key is missing.
      .map((p: any) => ({
        path: p.path,
        label: PATH_META[p.path]?.key ? t(PATH_META[p.path].key) : p.label,
      })),
    [given, capabilities, t]
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return pages.filter((p) => p.label.toLowerCase().includes(needle)).slice(0, 7);
  }, [q, pages]);

  useEffect(() => setCursor(0), [q]);

  // Clicking anywhere else closes the panel.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setQ('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[cursor].path); }
  };

  return (
    <div ref={boxRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
      <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('adminui.search_placeholder')}
        aria-label={t('adminui.search_placeholder')}
        className={cn(
          'h-9 w-full rounded-control border border-hairline bg-surface-2 pl-9 pr-12 text-sm text-primary',
          'placeholder:text-tertiary focus:border-brand/40 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20'
        )}
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-hairline px-1.5 py-0.5 text-[10px] font-semibold text-tertiary lg:block">
        ⌘K
      </kbd>

      {open && q.trim() !== '' && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-input border-t-[3px] border-brand bg-surface shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-tertiary">{t('adminui.search_none', { q: q.trim() })}</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.path}
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r.path)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm',
                  i === cursor ? 'bg-brand-tint text-brand-text' : 'text-secondary'
                )}
              >
                <span className="truncate">{r.label}</span>
                {i === cursor && <CornerDownLeft size={13} className="shrink-0 opacity-60" aria-hidden="true" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AccountMenu = () => {
  const { t } = useTranslation();
  const { user, role, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const name = String(user?.fullName || user?.username || '—');

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-control px-1.5 transition-colors duration-150 ease-standard hover:bg-surface-2"
      >
        <Avatar name={name} src={user?.avatar as string | undefined} size="sm" />
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-primary lg:block">{name}</span>
        <ChevronDown size={13} className={cn('hidden text-tertiary transition-transform lg:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 w-56 rounded-input border-t-[3px] border-brand bg-surface p-1.5 shadow-lg">
          <div className="border-b border-hairline px-2.5 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-primary">{name}</p>
            {/* The role, in the operator's own language — an admin portal should
                say which hat you are wearing, because several of these people
                hold more than one account. */}
            <p className="mt-0.5 truncate text-xs text-tertiary">{t(`enums.role.${role}`, role ?? '')}</p>
          </div>
          <Link
            to="/"
            className="mt-1 flex items-center gap-2 rounded-control px-2.5 py-2 text-sm text-secondary transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-primary"
          >
            <ExternalLink size={14} aria-hidden="true" />
            {t('adminui.view_site')}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-sm text-danger-text transition-colors duration-150 ease-standard hover:bg-danger/10"
          >
            <LogOut size={14} aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

const AdminTopBar = ({
  onOpenSidebar,
  pages,
  badge,
  menuLabel,
}: {
  onOpenSidebar: () => void;
  /** Override what ⌘K can jump to. Omitted = this operator's admin pages. */
  pages?: PortalPage[];
  /** The word beside the wordmark. Omitted = "Admin". */
  badge?: string;
  menuLabel?: string;
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur-nav">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <IconButton
          icon={Menu}
          label={menuLabel || t('admin.menu')}
          size="sm"
          onClick={onOpenSidebar}
          className="lg:hidden"
        />

        {/* The wordmark stays a link to the public site — it is the one thing an
            operator reaches for when they want to see what the public sees. */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-lg font-extrabold tracking-tight text-primary">
            Rwa<span className="text-brand-text">Sport</span>
          </span>
          <span className="hidden rounded-pill border border-hairline px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tertiary sm:block">
            {badge || t('adminui.admin')}
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <AdminSearch pages={pages} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
