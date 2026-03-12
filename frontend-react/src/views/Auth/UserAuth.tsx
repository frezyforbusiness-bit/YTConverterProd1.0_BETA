import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { PageTransition } from '../../components/common/PageTransition';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useUserAuth } from '../../context/UserAuthContext';

const Container = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing.xl};
`;

const AuthCardBase = styled(Card)`
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
`;

const AuthCard = motion(AuthCardBase);

const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h2};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  background: ${({ theme }) => theme.colors.text.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 4px;
  background: rgba(255, 255, 255, 0.02);
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  border: none;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accent.primary : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.background.primary : theme.colors.text.secondary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal}
    ${({ theme }) => theme.transitions.easing.smooth};
`;

const ErrorMessage = styled(motion.div)`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: linear-gradient(
    135deg,
    rgba(248, 113, 113, 0.1) 0%,
    rgba(248, 113, 113, 0.05) 100%
  );
  color: ${({ theme }) => theme.colors.status.error};
  border-left: 5px solid ${({ theme }) => theme.colors.status.error};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  text-align: left;
`;

const HelperText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: left;
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

type Mode = 'login' | 'register';

export const UserAuth: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useUserAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        if (mode === 'login') {
          await login(email, password);
        } else {
          await register(email, password);
        }
        // redirect back to converter (primary flow) after auth
        navigate('/converter');
      } catch (err: any) {
        setError(err.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, register, mode, navigate],
  );

  return (
    <PageTransition>
      <Container>
        <AuthCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Title>{mode === 'login' ? 'User Login' : 'Create Account'}</Title>

          <Tabs>
            <TabButton type="button" $active={mode === 'login'} onClick={() => setMode('login')}>
              Login
            </TabButton>
            <TabButton
              type="button"
              $active={mode === 'register'}
              onClick={() => setMode('register')}
            >
              Register
            </TabButton>
          </Tabs>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              fullWidth
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
              fullWidth
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading || !email || !password}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
            </Button>
          </form>

          {mode === 'register' && (
            <HelperText>
              Your account is for tracking conversions and preferences. You can still use the
              converter without an account.
            </HelperText>
          )}

          {loading && (
            <SpinnerContainer>
              <LoadingSpinner />
            </SpinnerContainer>
          )}

          {error && (
            <ErrorMessage
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </ErrorMessage>
          )}
        </AuthCard>
      </Container>
    </PageTransition>
  );
};

