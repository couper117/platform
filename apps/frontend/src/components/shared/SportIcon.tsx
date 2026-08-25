import React from 'react';
import {
  FaFutbol, FaBasketball, FaVolleyball, FaBicycle,
  FaBaseballBatBall, FaFootball, FaHandBackFist, FaPersonRunning, FaTrophy,
} from 'react-icons/fa6';

// Map sport slug → a real icon (no emojis).
const MAP = {
  football: FaFutbol,
  basketball: FaBasketball,
  volleyball: FaVolleyball,
  cycling: FaBicycle,
  cricket: FaBaseballBatBall,
  rugby: FaFootball,
  handball: FaHandBackFist,
  athletics: FaPersonRunning,
};

type SportIconProps = {
  slug?: string | null;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
};

// Every prop but the slug is optional — callers that only know the sport should
// not have to pass `style={undefined}` to satisfy the compiler.
const SportIcon = ({ slug, className, size, style }: SportIconProps) => {
  const Icon = (slug && MAP[slug]) || FaTrophy;
  return <Icon className={className} size={size} style={style} aria-hidden="true" />;
};

export default SportIcon;
