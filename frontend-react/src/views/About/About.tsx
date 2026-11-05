import { PageTitle } from '../../components/UI/PageHeading';
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
  padding: 32px 24px 48px;
  overflow: visible;
  @media (max-width: 640px) { padding: 16px 16px 32px; }
`;

const Title = PageTitle;

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
  box-shadow: none;
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
      'Audio from a link, with optional BPM & key detection.',
    icon: '01 /',
    path: '/',
  },
  {
    title: 'Mix & Master Analyzer',
    description:
      'Loudness, dynamics and tonal balance. Know your mix.',
    icon: '02 /',
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
            Built around the music.
          </Title>

          <InfoBlocks>
            <InfoBlock>
              <InfoBlockTitle>Less between you and the music</InfoBlockTitle>
              <InfoBlockText>Simple tools for converting audio and understanding your mix. Built to keep your session moving.</InfoBlockText>
            </InfoBlock>
            <InfoBlock>
              <InfoBlockTitle>Made for the process</InfoBlockTitle>
              <InfoBlockText>From a saved link to a final bounce. Fewer steps, more room to create.</InfoBlockText>
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

