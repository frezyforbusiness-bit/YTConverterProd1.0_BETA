import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { ServiceCard } from '../../components/UI/ServiceCard';
import { containerVariants } from '../../utils/animationVariants';
import { useNavigate } from 'react-router-dom';

const AboutContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow: visible;
`;

const TitleBase = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  white-space: nowrap;
  animation: float 3s ease-in-out infinite;

  @media (max-width: 1024px) {
    font-size: ${({ theme }) => theme.typography.sizes.h2};
  }

  @media (max-width: 768px) {
    white-space: normal;
  }
`;

const Title = motion(TitleBase);

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const InfoBlocks = styled.div`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const InfoBlock = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.xl}`};
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
`;

const InfoBlockTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const InfoBlockText = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  margin: 0;
`;

const ServicesGridBase = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.xl};
  margin-top: ${({ theme }) => theme.spacing['3xl']};
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ServicesGrid = motion(ServicesGridBase);

const services = [
  {
    title: 'Audio Converter',
    description:
      'Turn YouTube or Spotify links into clean audio files with optional BPM & key detection for DJs and producers.',
    icon: '🎵',
    path: '/converter',
  },
  {
    title: 'Mix & Master Analyzer',
    description:
      'Analyze your mix for LUFS, dynamics and tonal balance. Designed to give you quick, actionable feedback on your tracks.',
    icon: '🎚️',
    path: '/mixmaster',
    badge: 'BETA',
  },
];

export const About: React.FC = () => {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <AboutContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Title
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Producer Tools
          </Title>

          <InfoBlocks>
            <InfoBlock>
              <InfoBlockTitle>What is Producer Tools</InfoBlockTitle>
              <InfoBlockText>
                <Highlight>Producer Tools</Highlight> is a digital toolkit designed to change the way music producers work
                every day. The goal is simple: let technology quietly handle the boring parts so producers can stay
                focused on the music.
              </InfoBlockText>
            </InfoBlock>

            <InfoBlock>
              <InfoBlockTitle>Built from real studio needs</InfoBlockTitle>
              <InfoBlockText>
                Every tool starts from real studio needs: smarter sample management, idea generation, automation of
                repetitive steps and utilities built to speed up creative decisions. The focus never changes:{' '}
                <Highlight>less technical friction, more room for ideas</Highlight>.
              </InfoBlockText>
            </InfoBlock>

            <InfoBlock>
              <InfoBlockTitle>The long-term vision</InfoBlockTitle>
              <InfoBlockText>
                The vision behind <Highlight>Producer Tools</Highlight> is to build a modern toolbox for the contemporary producer:
                tools that are easy to understand, fast to use and solid enough to live inside professional workflows,
                from the bedroom studio to high–end mix rooms.
              </InfoBlockText>
            </InfoBlock>

            <InfoBlock>
              <InfoBlockTitle>From idea to final mix</InfoBlockTitle>
              <InfoBlockText>
                Starting from the <Highlight>Audio Converter</Highlight> and the analyzers, Producer Tools aims to become a suite
                that follows producers through every stage of the process: from the first idea, to organizing sounds,
                all the way to the final mix. Tools are built around one rule: if it doesn&apos;t make your workflow
                smoother, it doesn&apos;t ship.
              </InfoBlockText>
            </InfoBlock>
          </InfoBlocks>
        </motion.div>

        <ServicesGrid
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {services.map((service, index) => (
            <ServiceCard
              key={service.path}
              title={service.title}
              description={service.description}
              icon={service.icon}
              onClick={() => navigate(service.path)}
              gradientBorder={index === 0}
              index={index}
              badge={service.badge}
            />
          ))}
        </ServicesGrid>
      </AboutContainer>
    </PageTransition>
  );
};

