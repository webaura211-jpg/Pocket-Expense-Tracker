import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioAlert } from '../utils/audioAlert';

interface PullCordLampProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  soundEnabled?: boolean;
}

export const PullCordLamp: React.FC<PullCordLampProps> = ({
  theme,
  onToggle,
  soundEnabled = true,
}) => {
  const isLampOn = theme === 'light';

  // Persistent refs to keep event listeners stable across re-renders
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  const isLampOnRef = useRef(isLampOn);
  isLampOnRef.current = isLampOn;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [cordOffset, setCordOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const BASE_CORD_LENGTH = 38;
  const PULL_THRESHOLD = 20;

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const cordOffsetRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });
  const releaseVelocityRef = useRef({ vx: 0, vy: 0 });
  const animFrameRef = useRef<number | null>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // Physics-based damped spring oscillator for fluid, snappy recoil
  const startSpringBounce = useCallback((releaseY: number, releaseX: number, initVy = 0, initVx = 0) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startTime = performance.now();
    const duration = 850; // ms
    // Clamp initial velocity to reasonable limits
    const vy0 = Math.max(-120, Math.min(initVy * 0.1, 120));
    const vx0 = Math.max(-80, Math.min(initVx * 0.1, 80));

    // Underdamped harmonic oscillator parameters:
    // y(t) = exp(-gamma * t) * (A * cos(omega * t) + B * sin(omega * t))
    const gamma = 7.2; // Damping decay rate
    const omega = 22.5; // Natural frequency (rad/s) for crisp, responsive snap

    const tick = (currentTime: number) => {
      const t = (currentTime - startTime) / 1000; // in seconds

      if (t < duration / 1000) {
        const decay = Math.exp(-gamma * t);
        const cosTerm = Math.cos(omega * t);
        const sinTerm = Math.sin(omega * t);

        // Analytical solution with initial position and velocity
        const Ay = releaseY;
        const By = (vy0 + gamma * releaseY) / omega;
        const currentY = decay * (Ay * cosTerm + By * sinTerm);

        const Ax = releaseX;
        const Bx = (vx0 + gamma * releaseX) / omega;
        const currentX = decay * (Ax * cosTerm + Bx * sinTerm);

        cordOffsetRef.current = { x: currentX, y: currentY };
        setCordOffset({ x: currentX, y: currentY });

        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Settle cleanly at resting position (0, 0)
        cordOffsetRef.current = { x: 0, y: 0 };
        setCordOffset({ x: 0, y: 0 });
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Pointer down handler on acorn knob
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer so fast movements never lose tracking or lag
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    // Unlock browser audio context on user interaction
    audioAlert.unlock();

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    releaseVelocityRef.current = { vx: 0, vy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const rawDeltaY = e.clientY - startPosRef.current.y;
    const rawDeltaX = e.clientX - startPosRef.current.x;

    // Estimate release velocity for hyper-realistic physics
    const now = performance.now();
    const dt = Math.max(1, now - lastPosRef.current.time);
    const instVy = ((e.clientY - lastPosRef.current.x) / dt) * 1000;
    const instVx = ((e.clientX - lastPosRef.current.y) / dt) * 1000;
    releaseVelocityRef.current = {
      vy: instVy * 0.4 + releaseVelocityRef.current.vy * 0.6,
      vx: instVx * 0.4 + releaseVelocityRef.current.vx * 0.6,
    };
    lastPosRef.current = { x: e.clientX, y: e.clientY, time: now };

    // Fluid drag physics with soft rubber-band elasticity:
    // If pulling up, allow gentle elastic slack
    // If pulling down, direct 1:1 response up to 80px, then smooth logarithmic resistance up to 160px
    let deltaY: number;
    if (rawDeltaY < 0) {
      deltaY = Math.max(-14, rawDeltaY * 0.35);
    } else if (rawDeltaY <= 80) {
      deltaY = rawDeltaY;
    } else {
      deltaY = 80 + Math.pow(rawDeltaY - 80, 0.76) * 2.4;
      if (deltaY > 165) deltaY = 165;
    }

    // Gentle sideways pendulum sway
    const deltaX = Math.max(-36, Math.min(rawDeltaX * 0.45, 36));

    cordOffsetRef.current = { x: deltaX, y: deltaY };
    setCordOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    isDraggingRef.current = false;
    setIsDragging(false);

    const finalY = cordOffsetRef.current.y;
    const finalX = cordOffsetRef.current.x;
    const vy = releaseVelocityRef.current.vy;
    const vx = releaseVelocityRef.current.vx;

    // Always play the bouncing sound on release / recoil!
    if (soundEnabledRef.current) {
      audioAlert.playBounceSound();
    }

    if (finalY >= PULL_THRESHOLD) {
      // Toggled lamp ON/OFF
      if (soundEnabledRef.current) {
        if (!isLampOnRef.current) {
          audioAlert.playLampOn();
        } else {
          audioAlert.playLampOff();
        }
      }
      onToggleRef.current();

      // Launch bouncy spring recoil back to original resting position
      startSpringBounce(finalY, finalX, vy, vx);
    } else if (Math.abs(finalY) <= 8 && Math.abs(finalX) <= 8) {
      // Direct click/tap on the acorn: pull down slightly and bounce!
      if (soundEnabledRef.current) {
        if (!isLampOnRef.current) {
          audioAlert.playLampOn();
        } else {
          audioAlert.playLampOff();
        }
      }
      onToggleRef.current();
      startSpringBounce(30, 0, 0, 0);
    } else {
      // Released without reaching toggle threshold: still bounce back smoothly!
      startSpringBounce(finalY, finalX, vy, vx);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Compute acorn knob coordinates
  const currentY = BASE_CORD_LENGTH + cordOffset.y;
  const currentX = 20 + cordOffset.x;

  // Bezier curve control point for realistic hanging chain curvature
  const midX = 20 + (currentX - 20) * 0.52;
  const midY = currentY * 0.5;

  return (
    <div
      className="relative flex flex-col items-center select-none"
      title={isLampOn ? 'Pull cord to switch light OFF' : 'Pull cord to switch light ON'}
    >
      {/* Ceiling Lamp Fixture */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Canopy Mount */}
        <div className="w-5 h-1.5 rounded-xs bg-slate-400 dark:bg-slate-700 shadow-xs" />
        {/* Stem */}
        <div className="w-1 h-2 bg-slate-300 dark:bg-slate-600" />

        {/* Lamp Dome Shade */}
        <div className="relative w-10 h-6 -mt-0.5">
          <svg viewBox="0 0 40 24" className="w-full h-full filter drop-shadow-sm">
            <path
              d="M 2 22 C 2 9, 12 2, 20 2 C 28 2, 38 9, 38 22 Z"
              className={
                isLampOn
                  ? 'fill-amber-100 dark:fill-slate-200 stroke-amber-400 dark:stroke-slate-300'
                  : 'fill-slate-700 dark:fill-slate-800 stroke-slate-600'
              }
              strokeWidth="1.2"
            />
            <ellipse
              cx="20"
              cy="22"
              rx="18"
              ry="2"
              className={
                isLampOn
                  ? 'fill-amber-200 stroke-amber-400'
                  : 'fill-slate-800 stroke-slate-700'
              }
              strokeWidth="0.8"
            />
            <circle
              cx="20"
              cy="18"
              r="4.5"
              className={
                isLampOn
                  ? 'fill-amber-400 animate-pulse'
                  : 'fill-slate-600 dark:fill-slate-700'
              }
            />
            {isLampOn && (
              <circle
                cx="20"
                cy="18"
                r="3"
                className="fill-yellow-100"
              />
            )}
          </svg>

          {/* Warm Ambient Glow when ON */}
          {isLampOn && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-12 bg-amber-400/35 blur-md rounded-full pointer-events-none animate-in fade-in" />
          )}
        </div>
      </div>

      {/* SVG Hanging Chain & Interactive Acorn */}
      <div className="relative -mt-1 w-14 h-48 overflow-visible">
        <svg
          className="w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 40 180"
        >
          {/* Subtle hanging cord drop shadow */}
          <path
            d={`M 20 0 Q ${midX} ${midY} ${currentX} ${currentY}`}
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="2.2"
            strokeDasharray="2.5,1.5"
            strokeLinecap="round"
            className="translate-y-0.5"
          />

          {/* Beaded Pull Chain Path */}
          <path
            d={`M 20 0 Q ${midX} ${midY} ${currentX} ${currentY}`}
            fill="none"
            stroke={isLampOn ? '#94A3B8' : '#64748B'}
            strokeWidth="1.8"
            strokeDasharray="2.5,1.4"
            strokeLinecap="round"
          />

          {/* Small Metallic Connector Bead */}
          <circle
            cx={currentX}
            cy={currentY}
            r="2.2"
            fill={isLampOn ? '#F59E0B' : '#94A3B8'}
            stroke={isLampOn ? '#D97706' : '#64748B'}
            strokeWidth="0.5"
          />

          {/* Acorn Pull Bead with metallic sheen */}
          <g transform={`translate(${currentX}, ${currentY + 7})`}>
            {/* Acorn Body */}
            <path
              d="M 0 -6 C -4.2 -6, -5.2 1, 0 7.5 C 5.2 1, 4.2 -6, 0 -6 Z"
              className={`transition-colors duration-150 ${
                isDragging
                  ? 'fill-emerald-500 stroke-emerald-400'
                  : isLampOn
                  ? 'fill-amber-500 stroke-amber-400'
                  : 'fill-slate-400 dark:fill-slate-300 stroke-slate-500 dark:stroke-slate-400'
              }`}
              strokeWidth="1.1"
            />
            {/* Specular Highlight on Acorn */}
            <ellipse
              cx="-1.3"
              cy="-2"
              rx="1.4"
              ry="2.4"
              fill="rgba(255,255,255,0.7)"
            />
          </g>
        </svg>

        {/* Responsive, frictionless grab target for touch & mouse */}
        <div
          ref={knobRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate(${currentX - 22}px, ${currentY - 14}px)`,
            touchAction: 'none',
          }}
          className={`absolute top-0 left-0 w-11 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
            isDragging ? 'scale-115 cursor-grabbing' : 'hover:scale-110'
          }`}
          aria-label="Pull cord and release to toggle lighting"
        >
          {/* Subtle grab indicator ring on hover */}
          <div className="w-6 h-8 rounded-full border border-emerald-400/40 opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Helper label */}
      <span className="text-[9px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase -mt-26 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap">
        {isLampOn ? 'Light On' : 'Light Off'}
      </span>
    </div>
  );
};
