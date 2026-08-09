import { useTranslation } from 'react-i18next';

const normalize = (value) =>
  String(value)
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\w]/g, '')
    .toUpperCase();

const humanize = (value) =>
  String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const translateEnum = (t, group, value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback;

  const token = normalize(value);
  const key = `enums.${group}.${token}`;
  const translated = t(key);

  return translated === key ? humanize(value) : translated;
};

export const useEnumLabel = () => {
  const { t } = useTranslation();
  return (group, value, fallback = '') => translateEnum(t, group, value, fallback);
};

export default useEnumLabel;
