import React from 'react';
import styled from 'styled-components';

type FaqContext = 'converter' | 'mixmaster_analyzer' | 'default';

interface FooterProps {
  faqContext?: FaqContext;
}

const FooterContainer = styled.footer`
  margin-top: ${({ theme }) => theme.spacing['3xl']};
  padding: ${({ theme }) => `${theme.spacing['2xl']} ${theme.spacing.xl}`};
  border-top: 1px solid ${({ theme }) => theme.colors.accent.border};
  background: var(--color-footer);
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FooterInner = styled.div`
  max-width: 1216px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
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

const FaqItem = styled.details`
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const FaqQuestion = styled.summary`
  cursor: pointer;
  min-height: 24px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  margin-bottom: 2px;
`;

const FaqAnswer = styled.div`
  padding-top: 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
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

const defaultFaqs = [
  {
    question: 'Can I use Spotify links?',
    answer:
      "Yes. Spotify tracks are matched to an audio version on YouTube.",
  },
  {
    question: 'Are playlists supported?',
    answer: 'Single tracks only, for now.',
  },
  {
    question: 'Is this anonymous?',
    answer:
      'Yes. No user accounts are created; only admin analytics are tracked to keep the service healthy.',
  },
];

const mixmasterAnalyzerFaqs = [
  {
    question: 'What does Mix Master Analyzer check?',
    answer:
      'LUFS, true peak, dynamics, stereo field and tonal balance.',
  },
  {
    question: 'Is this a BETA feature?',
    answer:
      'Yes. Results offer technical guidance, not a replacement for a mastering engineer.',
  },
  {
    question: 'Which formats can I upload?',
    answer:
      'MP3, WAV, FLAC, M4A and OGG. Use a high-quality bounce for best results.',
  },
];

export const Footer: React.FC<FooterProps> = ({ faqContext = 'default' }) => {
  const faqs = faqContext === 'mixmaster_analyzer' ? mixmasterAnalyzerFaqs : defaultFaqs;

  return (
    <FooterContainer>
      <FooterInner>
        <Column>
          <ColumnTitle>Producer Tools</ColumnTitle>
          <p>Independent audio tools. Made for the process.</p>
        </Column>

        <Column>
          <ColumnTitle>FAQ</ColumnTitle>
          {faqs.map((item) => (
            <FaqItem key={item.question}>
              <FaqQuestion>{item.question}</FaqQuestion>
              <FaqAnswer>{item.answer}</FaqAnswer>
            </FaqItem>
          ))}
        </Column>


        <BottomRow>
          <span>© {new Date().getFullYear()} Producer Tools</span>
        </BottomRow>
      </FooterInner>
    </FooterContainer>
  );
};

