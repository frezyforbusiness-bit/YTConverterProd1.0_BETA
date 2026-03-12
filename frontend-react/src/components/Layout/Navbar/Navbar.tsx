import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

const NavbarBase = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: radial-gradient(circle at top left, #020617 0%, #020617 30%, #000 100%);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  z-index: ${({ theme }) => theme.zIndex.fixed};
  padding: ${({ theme }) => `${theme.spacing.sm} 0`};
`;

const NavbarContainer = motion(NavbarBase);

const NavContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoBase = styled(Link)`
  font-family: ${({ theme }) => theme.typography.fonts.heading};
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.black};
  text-decoration: none;
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Logo = motion(LogoBase);

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: 1023px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  position: relative;
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.text.primary : theme.colors.text.muted};
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  transition:
    color ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth},
    transform ${({ theme }) => theme.transitions.fast} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    transform: translateY(-1px);
  }
`;

const UnderlineBase = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #38bdf8, #6366f1);
  border-radius: 2px;
`;

const Underline = motion(UnderlineBase);

const HamburgerButtonBase = styled.button`
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};
  
  @media (max-width: 1023px) {
    display: flex;
  }
`;

const HamburgerButton = motion(HamburgerButtonBase);

const HamburgerLineBase = styled.div`
  width: 24px;
  height: 2px;
  background: ${({ theme }) => theme.colors.text.primary};
  border-radius: 2px;
`;

const HamburgerLine = motion(HamburgerLineBase);

const MobileMenuBase = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent.border};
  padding: ${({ theme }) => theme.spacing.lg};
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (min-width: 1024px) {
    display: none;
  }
`;

const MobileMenu = motion(MobileMenuBase);

const MobileNavLink = styled(Link)<{ $isActive: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.body};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.text.primary : theme.colors.text.secondary};
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  transition: all ${({ theme }) => theme.transitions.normal} ${({ theme }) => theme.transitions.easing.smooth};
  
  &:hover {
    background: rgba(154, 154, 154, 0.1);
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/converter', label: 'Converter' },
  { path: '/mixmaster', label: 'Mix Master' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const hamburgerVariants = {
    open: {
      rotate: 90,
    },
    closed: {
      rotate: 0,
    },
  };

  const line1Variants = {
    open: {
      rotate: 45,
      y: 6,
    },
    closed: {
      rotate: 0,
      y: 0,
    },
  };

  const line2Variants = {
    open: {
      opacity: 0,
    },
    closed: {
      opacity: 1,
    },
  };

  const line3Variants = {
    open: {
      rotate: -45,
      y: -6,
    },
    closed: {
      rotate: 0,
      y: 0,
    },
  };

  return (
    <>
      <NavbarContainer
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <NavContent>
          <Logo
            to="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            PT
          </Logo>

          <NavLinks>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink key={item.path} to={item.path} $isActive={isActive}>
                  {item.label}
                  {isActive && (
                    <Underline
                      layoutId="navbar-underline"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </NavLink>
              );
            })}
          </NavLinks>

          <HamburgerButton
            onClick={toggleMobileMenu}
            variants={hamburgerVariants}
            animate={mobileMenuOpen ? 'open' : 'closed'}
            aria-label="Toggle menu"
          >
            <HamburgerLine variants={line1Variants} />
            <HamburgerLine variants={line2Variants} />
            <HamburgerLine variants={line3Variants} />
          </HamburgerButton>
        </NavContent>
      </NavbarContainer>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <MobileNavLink
                  key={item.path}
                  to={item.path}
                  $isActive={isActive}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </MobileNavLink>
              );
            })}
          </MobileMenu>
        )}
      </AnimatePresence>
    </>
  );
};

