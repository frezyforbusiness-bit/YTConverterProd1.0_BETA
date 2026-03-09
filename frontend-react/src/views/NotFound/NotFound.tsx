import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Button } from '../../components/UI/Button';

const ContainerBase = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const Container = motion(ContainerBase);

const Code = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: clamp(4rem, 10vw, 6rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const Message = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 520px;
  margin: 0;
`;

const Waveform = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Bar = styled(motion.div)`
  width: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent.primary};
`;

const bars = [12, 20, 32, 18, 26, 14, 30, 16];

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <Container
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Code>404</Code>
        <Message>
          This track doesn&apos;t exist. The page you&apos;re looking for is off‑beat or out of tune.
        </Message>
        <Waveform>
          {bars.map((height, index) => (
            <Bar
              key={index}
              style={{ height }}
              animate={{
                scaleY: [1, 1.6, 0.9, 1.4, 1],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatType: 'mirror',
                delay: index * 0.08,
                ease: 'easeInOut',
              }}
            />
          ))}
        </Waveform>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/')}
        >
          Back to main stage
        </Button>
      </Container>
    </PageTransition>
  );
};


