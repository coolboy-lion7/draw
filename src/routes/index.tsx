import { memo, useCallback, useEffect, useMemo } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from 'react-router-dom';
import clsx from 'clsx';

import type Tournament from '#model/Tournament';
import type Stage from '#model/Stage';
import useFastDraw from '#store/useFastDraw';
import useDrawId from '#store/useDrawId';
import usePopup from '#store/usePopup';

import config from '../config';

import HeadMetadata from './HeadMetadata';
import Navbar from './Navbar';
import Pages from './Pages';
import currentSeasonByTournament from './currentSeasonByTournament';

interface Path {
  tournament?: Tournament;
  stage?: Stage;
}

const { defaultTournament, defaultStage } = config;

function useSeasonTournamentStage() {
  const match = useMatch(':tournament/:stage/*');
  const params = match?.params;
  const { tournament, stage } = (params ?? {}) as Path;

  const season = params
    ? +(
        params['*'] ||
        currentSeasonByTournament(tournament || null, stage || null)
      )
    : currentSeasonByTournament(defaultTournament, defaultStage);

  return useMemo(
    () => ({
      season,
      tournament,
      stage,
    }),
    [season, tournament, stage],
  );
}

function Routing() {
  const navigate = useNavigate();

  const [drawId, refreshDrawId] = useDrawId();
  const [popup] = usePopup();
  const [, setIsFastDraw] = useFastDraw();

  const o = useSeasonTournamentStage();

  useEffect(() => {
    setIsFastDraw(false);
    refreshDrawId();
  }, [o]);

  const { tournament, stage, season } = o;

  const onSeasonChange = useCallback(
    (tm: Tournament, sg: Stage, sn?: number) => {
      navigate(`/${tm}/${sg}${sn ? `/${sn}` : ''}`);
    },
    [navigate],
  );

  return (
    <>
      <HeadMetadata />
      <Navbar
        className={clsx(popup.initial && 'd-none')}
        season={season}
        tournament={tournament!}
        stage={stage!}
        onSeasonChange={onSeasonChange}
      />
      {tournament && stage ? (
        <Pages
          drawId={drawId}
          tournament={tournament}
          stage={stage}
          season={season}
          onSeasonChange={onSeasonChange}
        />
      ) : null}
      <Routes>
        {/* TODO */}
        <Route
          path="wc/ko/:season"
          element={
            <Navigate
              to={`/wc/${defaultStage}`}
              replace
            />
          }
        />
        <Route
          path="wc/ko"
          element={
            <Navigate
              to={`/wc/${defaultStage}`}
              replace
            />
          }
        />
        <Route
          path="wc"
          element={
            <Navigate
              to={`/wc/${defaultStage}`}
              replace
            />
          }
        />
        <Route
          path="el"
          element={
            <Navigate
              to={`/el/${defaultStage}`}
              replace
            />
          }
        />
        <Route
          path="cl/gs"
          element={
            <Navigate
              to="/cl/gs/2023"
              replace
            />
          }
        />
        <Route
          path="cl"
          element={
            <Navigate
              to="/cl/ls"
              replace
            />
          }
        />
        <Route
          path="el"
          element={
            <Navigate
              to="/el/ls"
              replace
            />
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={`/${defaultTournament}`}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default memo(Routing);
