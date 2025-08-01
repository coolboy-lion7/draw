import { memo } from 'react';

import type Club from '#model/team/Club';
import type NationalTeam from '#model/team/NationalTeam';
import getGroupLetter from '#utils/getGroupLetter';

import Group from './Group';
import * as styles from './styles.module.scss';

type Team = Club | NationalTeam;

interface Props {
  ref: React.RefObject<HTMLDivElement | null>;
  maxTeams: number;
  currentPotNum: number;
  groups: readonly (readonly Team[])[];
  possibleGroups: readonly number[] | null;
  getGroupHeaderClassName?: (index: number) => string;
}

function GroupsContainer({
  ref,
  maxTeams,
  currentPotNum,
  groups,
  possibleGroups,
  getGroupHeaderClassName,
}: Props) {
  return (
    <div
      ref={ref}
      className={styles.root}
    >
      {groups?.map((group, i) => {
        const letter = getGroupLetter(i);
        const headerClassName = getGroupHeaderClassName?.(i);

        return (
          <Group
            key={letter}
            maxTeams={maxTeams}
            groupLetter={letter}
            teams={group}
            potNum={currentPotNum}
            possible={!!possibleGroups?.includes(i)}
            headerClassName={headerClassName}
          />
        );
      })}
    </div>
  );
}

export default memo(GroupsContainer);
