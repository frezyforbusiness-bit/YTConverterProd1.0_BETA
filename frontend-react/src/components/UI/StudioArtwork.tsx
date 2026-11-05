import styled from 'styled-components';
const Artwork = styled.div`
  position: relative; height: 200px; overflow: hidden; background: #dad8c9;
  border: 1px solid #c9c6b7; margin-top: 40px;
  animation: studio-panel 1s cubic-bezier(.16, 1, .3, 1) .3s both;
  background-image: linear-gradient(#2526200a 1px, transparent 1px), linear-gradient(90deg, #2526200a 1px, transparent 1px);
  background-size: 20px 20px;
  &::before { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; top: -30px; right: 24px;
    background: radial-gradient(circle, #dad8c9 0 5px, #b83d1f 6px 38px, #292b25 39px 44px, transparent 45px), repeating-radial-gradient(circle, #292b25 0 2px, #45473b 3px 4px); }
  &::before { animation: record-settle 1.6s cubic-bezier(.16, 1, .3, 1) both; transition: transform 1s cubic-bezier(.16, 1, .3, 1); }
  @media (hover: hover) { &:hover::before { transform: rotate(18deg) scale(1.025); } }
  @keyframes record-settle { from { rotate: -65deg; scale: 1.12; } to { rotate: 0deg; scale: 1; } }
  &::after { content: 'SIDE A / PRODUCER TOOLS'; position: absolute; left: 16px; bottom: 16px; font: 10px monospace; writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 2px; }
  @media(max-width: 900px) { display: none; }
`;
export const StudioArtwork = () => <Artwork aria-hidden="true" />;
