import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { random, shuffle, stubArray, without } from 'lodash';

import PageRoot from '#ui/PageRoot';
import PotsContainer from '#ui/PotsContainer';
import MatchupsContainer from '#ui/MatchupsContainer';
import TablesContainer from '#ui/TablesContainer';
import * as bowlsContainerStyles from '#ui/bowls-container.module.scss';
import TeamBowl from '#ui/bowls/TeamBowl';
import * as separatorStyles from '#ui/separator.module.scss';
import Announcement from '#ui/Announcement';
import { serializeGsWorkerData } from '#model/WorkerData';
import type Team from '#model/team/KnockoutTeam';
import { type EmptyOrSingleOrPair, type FixedArray } from '#model/types';
import useWorkerSendAndReceive from '#utils/hooks/useWorkerSendAndReceive';
import useMedia from '#utils/hooks/useMedia';
import useXRay from '#store/useXRay';
import useFastDraw from '#store/useFastDraw';
import useDrawId from '#store/useDrawId';
import usePopup from '#store/usePopup';

import { type Func } from './worker';

const createWorker = () => new Worker(new URL('./worker', import.meta.url));

interface Props {
  season: number;
  pots: FixedArray<readonly Team[], 2>;
}

interface State {
  currentMatchupNum: number;
  currentPotNum: number;
  possiblePairings: readonly number[] | null;
  pots: FixedArray<readonly Team[], 2>;
  potsToDisplay: readonly [readonly Team[] | null, readonly Team[]];
  matchups: readonly EmptyOrSingleOrPair<Team>[];
}

function getState(
  initialPots: FixedArray<readonly Team[], 2>,
  season: number,
): State {
  const currentPotNum = 1;
  const currentMatchupNum = 0;
  const numMatchups = season < 2021 ? 16 : 8;
  const pots = initialPots.map(
    pot => shuffle(pot) as readonly Team[],
  ) as typeof initialPots;
  return {
    currentMatchupNum,
    currentPotNum,
    possiblePairings: null,
    pots,
    potsToDisplay: [null, pots[1]],
    matchups: Array.from({ length: numMatchups }, stubArray as () => []),
  };
}

function ELKO({ season, pots: initialPots }: Props) {
  const [drawId, setNewDrawId] = useDrawId();
  const [isFastDraw] = useFastDraw();

  const [
    {
      currentMatchupNum,
      currentPotNum,
      possiblePairings,
      pots,
      potsToDisplay,
      matchups,
    },
    setState,
  ] = useState(() => getState(initialPots, season));

  useEffect(() => {
    setState(getState(initialPots, season));
  }, [initialPots, season, drawId]);

  const isTallScreen = useMedia('(min-height: 750px)');
  const [, setPopup] = usePopup();
  const [isXRay] = useXRay();

  const getPossiblePairingsResponse = useWorkerSendAndReceive(
    createWorker,
  ) as Func;

  const groupsContanerRef = useRef<HTMLElement>(null);

  const selectedTeam = matchups.find(m => m.length === 1)?.at(-1);

  const getPossiblePairings = useCallback(
    async (
      newPots: FixedArray<readonly Team[], 2>,
      newMatchups: readonly EmptyOrSingleOrPair<Team>[],
    ) => {
      const [newGwPot, newRuPot] = newPots;
      const initialGwPot = initialPots[0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const pickedTeam = newMatchups.find(m => m.length === 1)?.at(-1)!;
      const groups = initialGwPot.map(gw => {
        const ru = newMatchups.find(pair => pair[1] === gw)?.[0];
        return ru ? [gw, ru] : [gw];
      });
      try {
        const allPossibleGroups = await getPossiblePairingsResponse(
          serializeGsWorkerData({
            season,
            pots: [[], newRuPot],
            groups,
            selectedTeam: pickedTeam,
          }),
        );
        return allPossibleGroups.map(i => newGwPot.indexOf(groups[i][0]));
      } catch (err) {
        setPopup({
          error: 'Could not determine possible pairings',
        });
        throw err;
      }
    },
    [initialPots, getPossiblePairingsResponse, season],
  );

  const handleBallPick = useCallback(
    async (index: number) => {
      const currentPot = potsToDisplay[currentPotNum]!;
      const pickedTeam = currentPot[index];

      const newPots = pots.with(
        currentPotNum,
        without(pots[currentPotNum], pickedTeam),
      ) as typeof pots;

      const newMatchups = matchups.with(currentMatchupNum, [
        ...(matchups[currentMatchupNum] as [Team]),
        pickedTeam,
      ]) as typeof matchups;

      const newPossiblePairings =
        currentPotNum === 1
          ? await getPossiblePairings(newPots, newMatchups)
          : null;

      const gwPot = newPossiblePairings
        ? newPots[0].filter((_, i) => newPossiblePairings.includes(i))
        : null;
      const newPotsToDisplay = [gwPot, pots[1]] as const;

      const newCurrentMatchNum = currentMatchupNum - currentPotNum + 1;

      setState(state => ({
        ...state,
        currentPotNum: 1 - currentPotNum,
        currentMatchupNum: newCurrentMatchNum,
        possiblePairings: newPossiblePairings,
        pots: newPots,
        potsToDisplay: newPotsToDisplay,
        matchups: newMatchups,
      }));
    },
    [
      pots,
      potsToDisplay,
      matchups,
      currentPotNum,
      currentMatchupNum,
      getPossiblePairings,
    ],
  );

  const autoPickIfOneBall = () => {
    if (isFastDraw) {
      return;
    }
    const isOnlyChoice =
      possiblePairings?.length === 1 ||
      (currentPotNum === 1 && pots[1].length === 1);
    if (isOnlyChoice) {
      handleBallPick(0);
    }
  };

  useEffect(() => {
    setTimeout(autoPickIfOneBall, 250);
  }, [currentPotNum]);

  const completed = currentMatchupNum >= initialPots[0].length;

  useEffect(() => {
    if (isFastDraw) {
      const teams = potsToDisplay[currentPotNum]!;
      const numTeams = teams.length;
      if (numTeams > 0) {
        const index = random(numTeams - 1);
        handleBallPick(index);
      }
    }
  }, [isFastDraw, currentPotNum]);

  return (
    <PageRoot>
      <TablesContainer>
        <PotsContainer
          selectedTeams={potsToDisplay[0]}
          initialPots={initialPots}
          pots={pots}
          currentPotNum={currentPotNum}
          split={!isTallScreen && season < 2021}
        />
        <MatchupsContainer
          ref={groupsContanerRef}
          matchups={matchups}
        />
      </TablesContainer>
      <div className={bowlsContainerStyles.root}>
        {!isFastDraw && (
          <>
            {!completed && (
              <div className={separatorStyles.root}>Runners-up</div>
            )}
            <TeamBowl
              forceNoSelect={currentPotNum === 0}
              display={!completed}
              displayTeams={isXRay}
              selectedTeam={selectedTeam ?? null}
              pot={potsToDisplay[1]}
              onPick={handleBallPick}
            />
            {!completed && (
              <div className={separatorStyles.root}>Group Winners</div>
            )}
            {potsToDisplay[0] && (
              <TeamBowl
                forceNoSelect={currentPotNum === 1}
                display={!completed}
                displayTeams={isXRay}
                selectedTeam={null}
                pot={potsToDisplay[0]}
                onPick={handleBallPick}
              />
            )}
          </>
        )}
        {completed && (
          <Announcement
            long={false}
            completed={completed}
            selectedTeam={null}
            pickedGroup={null}
            possibleGroups={null}
            numGroups={0}
            groupsElement={groupsContanerRef}
            reset={setNewDrawId}
          />
        )}
      </div>
    </PageRoot>
  );
}

export default memo(ELKO);
