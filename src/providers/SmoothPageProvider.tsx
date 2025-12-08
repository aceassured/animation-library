"use client";

import { AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export const SmoothPageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
};
