import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';

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

const Subtitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.accent};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.secondary};
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

export const About: React.FC = () => {
  return (
    <PageTransition>
      <AboutContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Title>About Producer Tools</Title>
          <Subtitle>Filippo &quot;Freeezy&quot; Piumatti</Subtitle>

          <Paragraph>
            <Highlight>Filippo Piumatti</Highlight> è un music producer, software engineer e fondatore di{' '}
            <Highlight>Producer Tools</Highlight>, una piattaforma dedicata alla creazione di strumenti digitali
            pensati per semplificare e potenziare il workflow dei producer musicali.
          </Paragraph>

          <Paragraph>
            Con un background che unisce <Highlight>produzione musicale</Highlight> e <Highlight>sviluppo software</Highlight>, Filippo
            costruisce tools che nascono da esigenze reali di studio: gestione di sample, generazione di idee musicali,
            automazione del workflow creativo e strumenti pensati per accelerare il processo di produzione.
          </Paragraph>

          <Paragraph>
            Il progetto <Highlight>Producer Tools</Highlight> nasce con una visione chiara: rendere la tecnologia un alleato creativo per i
            producer moderni, offrendo strumenti semplici, veloci e progettati da chi vive la musica ogni giorno.
          </Paragraph>

          <Paragraph>
            Parallelamente alla parte tecnica, Filippo lavora anche come <Highlight>producer</Highlight> e{' '}
            <Highlight>sound engineer</Highlight>, collaborando con diversi artisti e sviluppando progetti musicali sotto il nome
            artistico <Highlight>Freeezy</Highlight>.
          </Paragraph>
        </motion.div>
      </AboutContainer>
    </PageTransition>
  );
};

