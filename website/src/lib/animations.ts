import { Variants } from 'framer-motion';

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const softSpringTransition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const fadeInVariant: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springTransition as any,
  },
};

export const scaleInVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springTransition as any,
  },
};

export const hoverVariant = {
  scale: 1.02,
  y: -4,
  transition: { type: "spring", stiffness: 400, damping: 20 },
};

export const tapVariant = {
  scale: 0.98,
};
