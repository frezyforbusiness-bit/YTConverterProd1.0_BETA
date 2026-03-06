import React, { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { modalVariants, backdropVariants } from '../../../utils/animationVariants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const BackdropBase = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: ${({ theme }) => theme.zIndex.modalBackdrop};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Backdrop = motion(BackdropBase);

const ModalContainerBase = styled.div<{ $size: string }>`
  background: ${({ theme }) => theme.colors.background.elevated};
  backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1px solid ${({ theme }) => theme.colors.accent.border};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  max-width: ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return '400px';
      case 'lg':
        return '800px';
      case 'xl':
        return '1200px';
      default:
        return '600px';
    }
  }};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  z-index: ${({ theme }) => theme.zIndex.modal};
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
`;

const ModalTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const ModalContainer = motion(ModalContainerBase);

const CloseButtonBase = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  border-radius: 50%;
  font-size: 24px;
  transition: all ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    background: rgba(154, 154, 154, 0.1);
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.focusRing};
    outline-offset: 2px;
  }
`;

const CloseButton = motion(CloseButtonBase);

const ModalBody = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`;

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus modal
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();

    // Trap focus
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elementsArray = Array.from(focusableElements || []) as HTMLElement[];

      if (elementsArray.length === 0) return;

      const firstElement = elementsArray[0];
      const lastElement = elementsArray[elementsArray.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      // Restore previous focus
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Backdrop
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleBackdropClick}
        >
          <ModalContainer
            ref={modalRef}
            $size={size}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {(title || showCloseButton) && (
              <ModalHeader>
                {title && <ModalTitle id="modal-title">{title}</ModalTitle>}
                {showCloseButton && (
                  <CloseButton
                    onClick={onClose}
                    aria-label="Close modal"
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    ✕
                  </CloseButton>
                )}
              </ModalHeader>
            )}
            <ModalBody>{children}</ModalBody>
          </ModalContainer>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

