import { Variants } from 'motion/react';

/**
 * Standard motion presets for the Network Planning Toolkit.
 * Designed for subtle, purposeful interactions without layout shifts.
 */

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: 'easeIn' } 
  }
};

export const pageEntranceVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -6, 
    transition: { duration: 0.18, ease: 'easeIn' } 
  }
};

export const containerStaggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04
    }
  }
};

export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } 
  }
};

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.2, ease: 'easeOut' } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.15, ease: 'easeIn' } 
  }
};

export const modalCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      damping: 26, 
      stiffness: 340, 
      mass: 0.8 
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 6, 
    transition: { duration: 0.15, ease: 'easeIn' } 
  }
};

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0.7 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { 
      type: 'spring', 
      damping: 30, 
      stiffness: 320, 
      mass: 0.9 
    } 
  },
  exit: { 
    x: '100%', 
    opacity: 0, 
    transition: { duration: 0.2, ease: 'easeIn' } 
  }
};

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.92 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      type: 'spring', 
      damping: 22, 
      stiffness: 350 
    } 
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    scale: 0.95, 
    transition: { duration: 0.18, ease: 'easeIn' } 
  }
};
