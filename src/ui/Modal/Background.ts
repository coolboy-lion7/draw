import styled, { css, keyframes } from 'styled-components';

import Overlay from '../Overlay';

const BackgroundAnimation = keyframes`
  from {
    opacity: 0;
  }
`;

interface BackgroundProps {
  $animate: boolean;
}

const Background = styled(Overlay)<BackgroundProps>`
  background-color: light-dark(white, #222);
  opacity: 0.75;
  ${props =>
    props.$animate &&
    css`
      animation: ${BackgroundAnimation} 0.25s ease-out;
    `}
`;

export default Background;
