import React, { useState, useRef, useEffect, useCallback, type InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
}

const InputWrapper = styled.div<{ $fullWidth: boolean }>`
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LabelBase = styled.label<{ $hasValue: boolean; $error: boolean }>`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $error }) => ($error ? theme.colors.status.error : theme.colors.text.secondary)};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Label = LabelBase;

const InputContainer = styled.div<{ $error: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  ${({ $error }) => {
    if ($error) {
      return `
        animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
      `;
    }
    return '';
  }}
`;

const InputBase = styled.input<{ $hasIconLeft: boolean; $hasIconRight: boolean; $error: boolean; $success: boolean }>`
  width: 100%;
  padding: ${({ theme, $hasIconLeft, $hasIconRight }) => {
    let padding = `${theme.spacing.md} ${theme.spacing.lg}`;
    if ($hasIconLeft) {
      padding = `${theme.spacing.md} ${theme.spacing.lg} ${theme.spacing.md} ${theme.spacing['3xl']}`;
    }
    if ($hasIconRight) {
      padding = `${theme.spacing.md} ${theme.spacing['3xl']} ${theme.spacing.md} ${theme.spacing.lg}`;
    }
    if ($hasIconLeft && $hasIconRight) {
      padding = `${theme.spacing.md} ${theme.spacing['3xl']}`;
    }
    return padding;
  }};
  border: 2px solid;
  border-color: ${({ theme, $error, $success }) => {
    if ($error) return theme.colors.status.error;
    if ($success) return theme.colors.status.success;
    return theme.colors.accent.border;
  }};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-family: ${({ theme }) => theme.typography.fonts.body};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:focus {
    outline: none;
    border-color: ${({ theme, $error, $success }) => {
      if ($error) return theme.colors.status.error;
      if ($success) return theme.colors.status.success;
      return theme.colors.accent.primary;
    }};
    background: ${({ theme }) => theme.colors.background.card};
    box-shadow: 0 0 0 4px ${({ theme, $error, $success }) => {
      if ($error) return 'rgba(248, 113, 113, 0.2)';
      if ($success) return 'rgba(74, 222, 128, 0.2)';
      return theme.colors.accent.focusRing;
    }};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
    opacity: 0.5;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IconWrapper = styled.div<{ $position: 'left' | 'right' }>`
  position: absolute;
  ${({ $position }) => ($position === 'left' ? 'left' : 'right')}: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  pointer-events: none;
  z-index: 1;
`;

const ClearButtonBase = styled.button`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: pointer;
  border-radius: 50%;
  transition: all ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    background: rgba(154, 154, 154, 0.1);
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ClearButton = motion(ClearButtonBase);

const ErrorMessageBase = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.status.error};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-family: ${({ theme }) => theme.typography.fonts.body};
`;

const ErrorMessage = motion(ErrorMessageBase);

const SuccessIconBase = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.status.success};
`;

const SuccessIcon = motion(SuccessIconBase);

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  success,
  icon,
  iconPosition = 'left',
  clearable = false,
  onClear,
  fullWidth = true,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(isControlled ? '' : value || '');

  const currentValue = isControlled ? value : internalValue;
  const hasValue = Boolean(currentValue);
  const hasIconLeft = Boolean(icon && iconPosition === 'left');
  const hasIconRight = Boolean((icon && iconPosition === 'right') || clearable || success);

  // Only sync if controlled and value actually changed
  useEffect(() => {
    if (isControlled && value !== internalValue) {
      setInternalValue(value || '');
    }
  }, [isControlled, value]); // Removed internalValue from deps to avoid loops

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  }, [isControlled, onChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
  }, [onBlur]);

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    if (inputRef.current) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    }
    onClear?.();
    inputRef.current?.focus();
  }, [isControlled, onChange, onClear]);

  return (
    <InputWrapper $fullWidth={fullWidth}>
      {label && (
        <Label
          $hasValue={hasValue}
          $error={!!error}
        >
          {label}
        </Label>
      )}
      <InputContainer $error={!!error}>
        {hasIconLeft && <IconWrapper $position="left">{icon}</IconWrapper>}
        
        <InputBase
          ref={inputRef}
          $hasIconLeft={hasIconLeft}
          $hasIconRight={hasIconRight}
          $error={!!error}
          $success={!!success}
          value={currentValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...(props as any)}
        />
        
        <AnimatePresence>
          {clearable && hasValue && !success && (
            <ClearButton
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Clear input"
            >
              ✕
            </ClearButton>
          )}
        </AnimatePresence>
        
        {success && (
          <SuccessIcon
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            ✓
          </SuccessIcon>
        )}
        
        {hasIconRight && icon && iconPosition === 'right' && !clearable && !success && (
          <IconWrapper $position="right">{icon}</IconWrapper>
        )}
      </InputContainer>
      
      <AnimatePresence>
        {error && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </ErrorMessage>
        )}
      </AnimatePresence>
    </InputWrapper>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Note: We don't compare onChange/onFocus/onBlur as they're often recreated
  // but the component should still re-render if value changes
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.success === nextProps.success &&
    prevProps.label === nextProps.label &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.icon === nextProps.icon &&
    prevProps.iconPosition === nextProps.iconPosition &&
    prevProps.clearable === nextProps.clearable &&
    prevProps.fullWidth === nextProps.fullWidth
  );
});

