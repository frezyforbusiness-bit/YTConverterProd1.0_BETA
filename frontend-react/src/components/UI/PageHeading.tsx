import styled from 'styled-components';
import { motion } from 'framer-motion';

export const PageTitle = motion(styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.045em;
  text-align: left;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 24px 0;
`);

export const PageSubtitle = motion(styled.p`
  max-width: 600px;
  margin: 0 0 40px;
  text-align: left;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.65;
  @media (max-width: 640px) { margin-bottom: 24px; font-size: .9375rem; }
`);
