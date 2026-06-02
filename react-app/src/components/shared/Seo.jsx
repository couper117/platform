import React from 'react';
import { Helmet } from 'react-helmet-async';

const Seo = ({ title, description }) => (
  <Helmet>
    <title>{title ? `${title} | RwaSport` : 'RwaSport | Rwanda National Sports Platform'}</title>
    <meta name="description" content={description || 'The heartbeat of Rwandan sports. Real-time scores, league management, and athlete journeys.'} />
  </Helmet>
);

export default Seo;
