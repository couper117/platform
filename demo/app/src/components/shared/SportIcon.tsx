import React from 'react';
import {
  FaFutbol, FaBasketball, FaVolleyball, FaBicycle,
  FaBaseballBatBall, FaFootball, FaPersonRunning, FaPersonSwimming,
  FaTableTennisPaddleBall, FaChessKnight, FaTrophy,
} from 'react-icons/fa6';
import { MdSportsHandball, MdSportsTennis, MdSportsMartialArts, MdSportsMma } from 'react-icons/md';
import { GiBasketballBasket } from 'react-icons/gi';

/**
 * Sport slug → a real icon. No emojis.
 *
 * EVERY SPORT ON THE PLATFORM IS IN HERE. Only eight slugs were mapped, so the
 * `FaTrophy` fallback covered netball, swimming, tennis, judo, boxing and chess —
 * half the sports dropdown was the same trophy six times over, which tells the
 * reader nothing and looks like a bug rather than a default.
 *
 * FAMILY IS SUBORDINATE TO BEING RIGHT. Most of these are fa6, which is the set the
 * rest of the app draws from, but fa6 has no tennis racquet, no martial art and no
 * netball ring — so Material fills three and Game Icons fills one. All four are
 * solid single-path glyphs at the same optical weight as fa6; a mixed set that
 * names the sport beats a consistent set that does not.
 *
 * WHY BOXING IS A GLOVE AND HANDBALL IS NO LONGER A FIST. Handball used to be
 * `FaHandBackFist`. Adding boxing next to it would have put two fists in the same
 * list, so handball takes Material's own handball glyph and the fist idea goes to
 * boxing as a glove.
 */
const MAP = {
  football: FaFutbol,
  basketball: FaBasketball,
  volleyball: FaVolleyball,
  cycling: FaBicycle,
  athletics: FaPersonRunning,
  handball: MdSportsHandball,
  // Netball's defining object is the ring — no backboard, unlike basketball.
  netball: GiBasketballBasket,
  swimming: FaPersonSwimming,
  tennis: MdSportsTennis,
  judo: MdSportsMartialArts,
  boxing: MdSportsMma,
  chess: FaChessKnight,
  // The Amashuri Games run two sports the national leagues do not, under their
  // own slugs — both were showing the trophy on /amashuri.
  rugby: FaFootball,
  'table-tennis': FaTableTennisPaddleBall,
  // Not on the platform today, kept from the original map so a future sport row
  // does not silently fall back to the trophy.
  cricket: FaBaseballBatBall,
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
