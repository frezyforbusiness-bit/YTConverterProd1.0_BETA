import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ServiceCard } from '../../components/UI/ServiceCard';
import { PageTransition } from '../../components/common/PageTransition';
import { containerVariants } from '../../utils/animationVariants';

const HomeContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const HeroSectionBase = styled.section`
  text-align: center;
  padding: ${({ theme }) => `${theme.spacing['3xl']} 0`};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`;

const HeroSection = motion(HeroSectionBase);

const HeroTitleBase = styled.h1`
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
  animation: float 3s ease-in-out infinite;
`;

const HeroTitle = motion(HeroTitleBase);

const HeroSubtitleBase = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.weights.regular};
  max-width: 600px;
  margin: 0 auto;
`;

const HeroSubtitle = motion(HeroSubtitleBase);

const ServicesGridBase = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
      'Drop in a YouTube or Spotify track and get a clean, tagged audio file. Optional BPM & key detection for DJs and producers.',
    icon: '🎵',
    path: '/converter',
  },
  {
    title: 'Mix & Master Analyzer',
    description:
      'Professional audio analysis tool. Analyze your tracks for LUFS, dynamic range, frequency balance, and get detailed feedback. Currently in beta.',
    icon: '🎚️',
    path: '/mixmaster',
    badge: 'BETA',
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <HomeContainer>
        <HeroSection>
          <HeroTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🎵 Producer Tools
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Professional audio tools for music producers. Convert, analyze, and perfect your tracks.
          </HeroSubtitle>
        </HeroSection>

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
      </HomeContainer>
    </PageTransition>
  );
};

