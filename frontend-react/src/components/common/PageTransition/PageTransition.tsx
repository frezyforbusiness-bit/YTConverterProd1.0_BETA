import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageVariants, pageTransition } from '../../../utils/animationVariants';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

