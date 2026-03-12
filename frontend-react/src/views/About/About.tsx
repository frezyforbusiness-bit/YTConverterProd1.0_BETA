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

          <Paragraph>
            <Highlight>Producer Tools</Highlight> è una piattaforma di strumenti digitali pensata per cambiare il modo
            in cui i producer musicali lavorano ogni giorno. L&apos;obiettivo è rendere la tecnologia un alleato
            silenzioso che si occupa delle parti noiose, lasciando il producer concentrato solo sulla musica.
          </Paragraph>

          <Paragraph>
            Ogni tool nasce da esigenze reali di studio: gestione di sample, generazione di idee musicali, automazione
            dei passaggi ripetitivi e utilità pensate per velocizzare le decisioni creative. Il focus è sempre lo
            stesso: <Highlight>meno frizione tecnica, più spazio per le idee</Highlight>.
          </Paragraph>

          <Paragraph>
            La visione di <Highlight>Producer Tools</Highlight> è costruire una cassetta degli attrezzi moderna per il producer
            contemporaneo: strumenti semplici da capire, veloci da usare e abbastanza solidi da integrarsi nei workflow
            professionali, dal bedroom studio al grande mix room.
          </Paragraph>

          <Paragraph>
            A partire dall&apos;<Highlight>Audio Converter</Highlight> e dagli analyzer, Producer Tools vuole diventare una suite che segue il
            producer in tutte le fasi del processo: dall&apos;idea iniziale, all&apos;organizzazione dei suoni, fino al mix finale.
            Strumenti costruiti con una regola chiara: se non rende il tuo workflow più fluido, non serve.
          </Paragraph>
        </motion.div>
      </AboutContainer>
    </PageTransition>
  );
};

