import { memo } from 'react';

import type Club from '#model/team/Club';
import type NationalTeam from '#model/team/NationalTeam';
import Table from '#ui/table/Table';
import Header from '#ui/table/Header';
import Row from '#ui/table/Row';
import Cell from '#ui/table/Cell';

import GroupCellDeferred from './GroupCellDeferred';

type Team = Club | NationalTeam;

interface Props {
  maxTeams: number;
  groupLetter: string;
  teams: readonly Team[];
  potNum: number;
  possible: boolean;
  headerClassName?: string;
}

function Group({
  maxTeams,
  groupLetter,
  teams,
  potNum,
  possible,
  headerClassName,
}: Props) {
  return (
    <Table>
      <thead>
        <Row>
          <Cell>
            <Header className={headerClassName}>Group {groupLetter}</Header>
          </Cell>
        </Row>
      </thead>
      <tbody>
        {Array.from({ length: maxTeams }, (_, i) => (
          <Row key={i}>
            <GroupCellDeferred
              team={teams[i]}
              possible={i === potNum && possible}
            />
          </Row>
        ))}
      </tbody>
    </Table>
  );
}

export default memo(Group);
