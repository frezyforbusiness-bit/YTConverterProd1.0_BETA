import { useAnimation } from 'framer-motion';
import { useEffect } from 'react';

export const useAnimationSequence = (
  controls: ReturnType<typeof useAnimation>,
  sequence: Array<{ key: string; animation: any; delay?: number }>
) => {
  useEffect(() => {
    const runSequence = async () => {
      for (const step of sequence) {
        if (step.delay) {
          await new Promise((resolve) => setTimeout(resolve, step.delay));
        }
        await controls.start(step.animation);
      }
    };
    runSequence();
  }, [controls, sequence]);
};

export const useStaggerAnimation = (
  itemCount: number,
  staggerDelay: number = 0.1
) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      transition: {
        staggerChildren: staggerDelay,
      },
    });
  }, [controls, staggerDelay, itemCount]);

  return controls;
};

