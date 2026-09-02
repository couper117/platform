import { useTranslation } from 'react-i18next';
import { format as formatDate } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

const RW_MONTHS_WIDE = [
  'Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena',
  'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza',
];

const RW_MONTHS_ABBREVIATED = [
  'Mut', 'Gas', 'Wer', 'Mat', 'Gic', 'Kam',
  'Nya', 'Kan', 'Nze', 'Ukw', 'Ugu', 'Uku',
];

const RW_MONTHS_NARROW = ['M', 'G', 'W', 'M', 'G', 'K', 'N', 'K', 'N', 'U', 'U', 'U'];

const RW_DAYS_WIDE = [
  'Ku Cyumweru', 'Ku wa Mbere', 'Ku wa Kabiri', 'Ku wa Gatatu',
  'Ku wa Kane', 'Ku wa Gatanu', 'Ku wa Gatandatu',
];

const RW_DAYS_ABBREVIATED = ['Cyu', 'Mbe', 'Kab', 'Gat', 'Kan', 'Gtn', 'Gtd'];

const RW_DAYS_NARROW = ['C', 'M', 'K', 'G', 'K', 'G', 'G'];

const pick = (narrow, abbreviated, wide) => (index, options: any = {}) => {
  switch (options.width) {
    case 'narrow':
      return narrow[index];
    case 'wide':
      return wide[index];
    case 'abbreviated':
    default:
      return abbreviated[index];
  }
};

const rw = {
  ...enUS,
  code: 'rw',
  localize: {
    ...enUS.localize,
    month: pick(RW_MONTHS_NARROW, RW_MONTHS_ABBREVIATED, RW_MONTHS_WIDE),
    day: pick(RW_DAYS_NARROW, RW_DAYS_ABBREVIATED, RW_DAYS_WIDE),
  },
};

const LOCALES = { en: enUS, fr, rw };

export const getDateLocale = (language) => LOCALES[String(language).split('-')[0]] || enUS;

export const useDateFormat = () => {
  const { i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);

  return (value, pattern) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return formatDate(date, pattern, { locale });
  };
};

/**
 * Re-express an instant so its LOCAL fields read as its UTC fields.
 *
 * date-fns formats in the browser's timezone, which is right for a moment in
 * time and wrong for a calendar date. A Prisma `@db.Date` column arrives as
 * "2026-08-29T00:00:00.000Z" — a day, not an instant — and formatting that
 * anywhere west of Greenwich gives 28 August, because 00:00 UTC is the previous
 * evening there. Umuganda is the last Saturday of the month; rendering it as a
 * Friday is not a rounding error, it names the wrong day.
 *
 * Shifting the value so its local components equal its UTC ones lets date-fns
 * keep doing the formatting and the localisation, and simply stops it applying
 * an offset that a date-only value never had.
 */
const asUtcFields = (d: Date) =>
  new Date(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(),
  );

/**
 * Format a date-only value — an Umuganda day, a birth date, a season start.
 *
 * Use this whenever the value came from a DATE column. For a real instant (a
 * kick-off time), use useDateFormat, which correctly shows it in the viewer's
 * own timezone.
 */
export const useDayFormat = () => {
  const { i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);

  return (value, pattern) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return formatDate(asUtcFields(date), pattern, { locale });
  };
};

export default useDateFormat;
