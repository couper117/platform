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

export default useDateFormat;
