-- AlterEnum
--
-- Scoring, discipline and stoppage events for the sports this platform runs that
-- are not football. The enum held only football's vocabulary, so a basketball
-- reporter could log nothing but a one-point "GOAL" and a 58-61 game could not be
-- reported at all. Point weights live in services/matchEvents.service.ts.
--
-- Additive only: no existing value is renamed or removed, so every stored event
-- keeps its meaning and this migration cannot fail on existing data.
ALTER TYPE "EventType" ADD VALUE 'TWO_POINTER';
ALTER TYPE "EventType" ADD VALUE 'THREE_POINTER';
ALTER TYPE "EventType" ADD VALUE 'FREE_THROW';
ALTER TYPE "EventType" ADD VALUE 'DUNK';
ALTER TYPE "EventType" ADD VALUE 'FOUL';
ALTER TYPE "EventType" ADD VALUE 'TIMEOUT';
ALTER TYPE "EventType" ADD VALUE 'SUSPENSION';
ALTER TYPE "EventType" ADD VALUE 'SEVEN_METRE';
ALTER TYPE "EventType" ADD VALUE 'SET_WON';
ALTER TYPE "EventType" ADD VALUE 'TRY';
ALTER TYPE "EventType" ADD VALUE 'CONVERSION';
ALTER TYPE "EventType" ADD VALUE 'PENALTY_KICK';
ALTER TYPE "EventType" ADD VALUE 'DROP_GOAL';
