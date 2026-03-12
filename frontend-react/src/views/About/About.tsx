import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { ServiceCard } from '../../components/UI/ServiceCard';
import { containerVariants } from '../../utils/animationVariants';
import { useNavigate } from 'react-router-dom';

const AboutContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Paragraph = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
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
          <Title>Producer Tools</Title>

          <Paragraph>
            <Highlight>Producer Tools</Highlight> is a digital toolkit designed to change the way music producers work
            every day. The goal is simple: let technology quietly handle the boring parts so producers can stay focused
            on the music.
          </Paragraph>

          <Paragraph>
            Every tool starts from real studio needs: smarter sample management, idea generation, automation of
            repetitive steps and utilities built to speed up creative decisions. The focus never changes:{' '}
            <Highlight>less technical friction, more room for ideas</Highlight>.
          </Paragraph>

          <Paragraph>
            The vision behind <Highlight>Producer Tools</Highlight> is to build a modern toolbox for the contemporary producer: tools
            that are easy to understand, fast to use and solid enough to live inside professional workflows, from the
            bedroom studio to high–end mix rooms.
          </Paragraph>

          <Paragraph>
            Starting from the <Highlight>Audio Converter</Highlight> and the analyzers, Producer Tools aims to become a suite that
            follows producers through every stage of the process: from the first idea, to organizing sounds, all the way
            to the final mix. Tools are built around one rule: if it doesn&apos;t make your workflow smoother, it doesn&apos;t ship.
          </Paragraph>
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

