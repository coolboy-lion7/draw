import type Tournament from '#model/Tournament';
import type Stage from '#model/Stage';

import config from '../config';

const { wc, uefa } = config.currentSeason;

export default (tournament: Tournament | null, stage: Stage | null): number => {
  const resolvedTournament = tournament || 'cl';
  const resolvedState =
    stage ||
    (resolvedTournament === 'cl' || resolvedTournament === 'el' ? 'ls' : 'gs');
  return resolvedTournament === 'wc'
    ? wc
    : uefa[resolvedTournament][resolvedState];
};
