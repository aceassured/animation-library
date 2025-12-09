import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeOutProps {
  children: ReactNode;
  delay?: number;
}

export const FadeOut = ({ children, delay = 0 }: FadeOutProps) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        y: 24,
        scale: 0.97,
        filter: "blur(6px)",
      }}
      transition={{
        delay,
        type: "spring",
        stiffness: 140,
        damping: 26,
        mass: 1,
      }}
    >
      {children}
    </motion.div>
  );
};
