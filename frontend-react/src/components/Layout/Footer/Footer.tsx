import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  margin-top: ${({ theme }) => theme.spacing['3xl']};
  padding: ${({ theme }) => `${theme.spacing['2xl']} ${theme.spacing.xl}`};
  border-top: 1px solid ${({ theme }) => theme.colors.accent.border};
  background: radial-gradient(circle at top, #020617 0%, #020617 40%, #000 100%);
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FooterInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
`;

const Column = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
`;

const ColumnTitle = styled.h4`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const FaqItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FaqQuestion = styled.div`
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: 2px;
`;

const FaqAnswer = styled.div`
  color: ${({ theme }) => theme.colors.text.muted};
`;

const BottomRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterInner>
        <Column>
          <ColumnTitle>Producer Tools</ColumnTitle>
          <p>Street-ready tools for DJs and producers. Fast YouTube &amp; Spotify conversions with BPM &amp; key analysis.</p>
        </Column>

        <Column>
          <ColumnTitle>FAQ</ColumnTitle>
          <FaqItem>
            <FaqQuestion>Can I use Spotify links?</FaqQuestion>
            <FaqAnswer>
              Yes. Paste a single Spotify track URL and we&apos;ll search the cleanest audio/lyrics version on YouTube.
            </FaqAnswer>
          </FaqItem>
          <FaqItem>
            <FaqQuestion>Are playlists supported?</FaqQuestion>
            <FaqAnswer>
              Not yet. For now convert one track at a time for best reliability.
            </FaqAnswer>
          </FaqItem>
          <FaqItem>
            <FaqQuestion>Is this anonymous?</FaqQuestion>
            <FaqAnswer>
              Yes. No user accounts are created; only admin analytics are tracked to keep the service healthy.
            </FaqAnswer>
          </FaqItem>
        </Column>

        <Column>
          <ColumnTitle>Tips</ColumnTitle>
          <p>Use high quality headphones, check levels before playing out, and always test your files in your DJ software.</p>
        </Column>

        <BottomRow>
          <span>© {new Date().getFullYear()} Producer Tools</span>
          <span>Built for the underground, safe for the mainstream.</span>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
};

