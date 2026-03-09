import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from '../../UI/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Error boundary should be as robust as possibile and non dipendere dal tema
// per evitare crash se il ThemeProvider non è inizializzato.
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 32px;
  text-align: center;
`;

const ErrorTitle = styled.h2`
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1.75rem;
  color: #f87171;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #c0c0c0;
  margin-bottom: 24px;
`;

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryFallback: React.FC<{
  error: Error | null;
  onReset: () => void;
}> = ({ error, onReset }) => {
  return (
    <ErrorContainer>
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorMessage>
        {error?.message || 'An unexpected error occurred'}
      </ErrorMessage>
      <Button onClick={onReset} variant="primary">
        Try Again
      </Button>
    </ErrorContainer>
  );
};

export const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

