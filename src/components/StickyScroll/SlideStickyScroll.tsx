import StickyScroll, { FeatureCard, StickyScrollProps } from "./StickyScroll";
import { motion, useScroll } from "framer-motion";

export function SlideStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      renderCustomCard={(item, index) => (
        <motion.div
          initial={{ x: index % 2 === 0 ? -80 : 80, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <FeatureCard
            item={item}
            index={index}
            totalItems={props.items.length}
            scrollYProgress={useScroll().scrollYProgress}
          />
        </motion.div>
      )}
    />
  );
}
