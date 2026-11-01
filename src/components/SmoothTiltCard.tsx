import React, { useRef, useEffect } from 'react';

interface SmoothTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Maximum rotation in degrees
  scale?: number; // Subtle hover lift
  glowOpacity?: number; // Opacity of the specular cursor highlight
  style?: React.CSSProperties;
}

/**
 * High-performance 60fps 3D perspective tilt card.
 * Uses requestAnimationFrame with velocity-damped lerp interpolation
 * to deliver ultra-smooth, zero-lag cursor tracking.
 * Includes adaptive specular sheen that enhances contrast in both light and dark modes.
 */
export const SmoothTiltCard: React.FC<SmoothTiltCardProps> = ({
  children,
  className = '',
  maxTilt = 5.5,
  scale = 1.006,
  glowOpacity = 0.12,
  style = {},
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Targets and interpolated values
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const targetGlareX = useRef(50);
  const targetGlareY = useRef(50);
  const currentGlareX = useRef(50);
  const currentGlareY = useRef(50);
  const currentGlareOpacity = useRef(0);
  const targetGlareOpacity = useRef(0);

  const isHovered = useRef(false);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card) return;

    const updatePhysics = () => {
      // Lerp interpolation factor (0.12 gives silky-smooth buttery settling without lag)
      const lerpFactor = 0.12;

      currentX.current += (targetX.current - currentX.current) * lerpFactor;
      currentY.current += (targetY.current - currentY.current) * lerpFactor;
      currentGlareX.current += (targetGlareX.current - currentGlareX.current) * lerpFactor;
      currentGlareY.current += (targetGlareY.current - currentGlareY.current) * lerpFactor;
      currentGlareOpacity.current += (targetGlareOpacity.current - currentGlareOpacity.current) * lerpFactor;

      const rotX = -currentY.current * maxTilt;
      const rotY = currentX.current * maxTilt;
      const currentScale = isHovered.current ? scale : 1;

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg) scale3d(${currentScale}, ${currentScale}, 1)`;

      if (glare) {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          glare.style.background = `radial-gradient(circle 320px at ${currentGlareX.current.toFixed(1)}% ${currentGlareY.current.toFixed(1)}%, rgba(255, 255, 255, ${currentGlareOpacity.current.toFixed(3)}), transparent 75%)`;
          glare.style.mixBlendMode = 'normal';
        } else {
          // In light mode, use a soft pearl sheen that does NOT whiten or wash out dark text
          glare.style.background = `radial-gradient(circle 320px at ${currentGlareX.current.toFixed(1)}% ${currentGlareY.current.toFixed(1)}%, rgba(148, 163, 184, ${(currentGlareOpacity.current * 0.35).toFixed(3)}), transparent 70%)`;
          glare.style.mixBlendMode = 'multiply';
        }
      }

      // Check if motion is essentially settled when not hovering
      const isMoving =
        Math.abs(targetX.current - currentX.current) > 0.001 ||
        Math.abs(targetY.current - currentY.current) > 0.001 ||
        Math.abs(targetGlareOpacity.current - currentGlareOpacity.current) > 0.002;

      if (isHovered.current || isMoving) {
        animFrameId.current = requestAnimationFrame(updatePhysics);
      } else {
        animFrameId.current = null;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (glare) {
          glare.style.background = 'transparent';
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return;
      }

      const x = (clientX - rect.left) / rect.width; // 0 to 1
      const y = (clientY - rect.top) / rect.height; // 0 to 1

      // Normalise to [-1, 1]
      targetX.current = (x - 0.5) * 2;
      targetY.current = (y - 0.5) * 2;

      targetGlareX.current = x * 100;
      targetGlareY.current = y * 100;
      targetGlareOpacity.current = glowOpacity;

      if (!animFrameId.current) {
        animFrameId.current = requestAnimationFrame(updatePhysics);
      }
    };

    const handlePointerEnter = () => {
      isHovered.current = true;
      targetGlareOpacity.current = glowOpacity;
      if (!animFrameId.current) {
        animFrameId.current = requestAnimationFrame(updatePhysics);
      }
    };

    const handlePointerLeave = () => {
      isHovered.current = false;
      targetX.current = 0;
      targetY.current = 0;
      targetGlareOpacity.current = 0;
      if (!animFrameId.current) {
        animFrameId.current = requestAnimationFrame(updatePhysics);
      }
    };

    card.addEventListener('pointerenter', handlePointerEnter);
    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      card.removeEventListener('pointerenter', handlePointerEnter);
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [maxTilt, scale, glowOpacity]);

  return (
    <div
      ref={cardRef}
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        ...style,
      }}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Specular Glare Sheen Layer */}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 z-30 transition-opacity"
        aria-hidden="true"
      />
      {children}
    </div>
  );
};
