'use client'

import { Variants } from "framer-motion";


// ======================================
// CONTAINER ANIMATION
// USED FOR LISTS, GRIDS, SECTIONS 
// ======================================
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};


// ======================================
// CARD AMIMATION
// USED FOR CARDS, FEATURES, ITEMS 
// ======================================
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 14,
    },
  },
};