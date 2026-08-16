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

const SportIcon = ({ slug, className, size, style }: { slug?: string; className?: string; size?: number; style?: React.CSSProperties }) => {
  const Icon = MAP[slug] || FaTrophy;
  return <Icon className={className} size={size} style={style} aria-hidden="true" />;
};

export default SportIcon;
