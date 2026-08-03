import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_DESC = 'The heartbeat of Rwandan sports. Real-time scores, league management, and athlete journeys.';

const Seo = ({ title, description, image, canonical, type = 'website' }) => {
  const fullTitle = title ? `${title} | RwaSport` : 'RwaSport | Rwanda National Sports Platform';
  const desc = description || DEFAULT_DESC;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {/* Twitter */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export default Seo;
