import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const Seo = ({ title, description }) => {
  const { t, i18n } = useTranslation();

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{title ? `${title} | RwaSport` : t('seo.site_title')}</title>
      <meta name="description" content={description || t('seo.site_description')} />
    </Helmet>
  );
};

export default Seo;
