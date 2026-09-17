import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiUsers, FiAward, FiStar, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Hero3DShowcaseProps {
  activeStudents?: number;
  certificatesAwarded?: number;
}

export const Hero3DShowcase: React.FC<Hero3DShowcaseProps> = ({
  activeStudents = 0,
  certificatesAwarded = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse tilt motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 24 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  // 3D Rotations
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-16, 16]);

  // Dynamic parallax layers translation
  const layerTopX = useTransform(mouseXSpring, [-0.5, 0.5], [-24, 24]);
  const layerTopY = useTransform(mouseYSpring, [-0.5, 0.5], [-24, 24]);

  // Interactive 3D Sphere & Particle Animation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    // 3D Sphere Points
    const numPoints = 80;
    const radius = Math.min(width, height) * 0.38;
    const points: { x: number; y: number; z: number; size: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.sqrt(numPoints * Math.PI) * theta;
      points.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        size: Math.random() * 2 + 1.2,
      });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Auto rotation speed + mouse influence
      const targetSpeedX = (x.get() * 0.04) + 0.003;
      const targetSpeedY = (y.get() * 0.04) + 0.005;

      angleX += targetSpeedX;
      angleY += targetSpeedY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const centerX = width / 2;
      const centerY = height / 2;
      const fov = 350;

      // Draw connecting orbital rings
      ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 0.9, radius * 0.35, angleY * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Draw and project 3D points
      points.forEach((p) => {
        // Rotate Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate X
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Perspective Projection
        const scale = fov / (fov + z2 + radius);
        const projX = centerX + x1 * scale;
        const projY = centerY + y1 * scale;

        // Depth alpha calculation
        const alpha = Math.max(0.1, (z2 + radius) / (2 * radius));

        ctx.fillStyle = isDark
          ? `rgba(129, 140, 248, ${alpha * 0.85})`
          : `rgba(79, 70, 229, ${alpha * 0.7})`;

        ctx.beginPath();
        ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Glowing halo for prominent foreground particles
        if (alpha > 0.6) {
          ctx.fillStyle = isDark
            ? `rgba(192, 132, 252, ${alpha * 0.3})`
            : `rgba(147, 51, 234, ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(projX, projY, p.size * scale * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark, x, y]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto select-none" style={{ perspective: 1200 }}>
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
        }}
        className="relative rounded-3xl p-3 sm:p-4 bg-white/85 dark:bg-[#0c1022]/85 border border-slate-200/90 dark:border-white/[0.16] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] transition-all duration-300 group"
      >
        {/* Layer 0: 3D Canvas Background Orb */}
        <div 
          style={{ transform: 'translateZ(0px)' }}
          className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[1.85/1] bg-gradient-to-b from-slate-900 via-[#070b19] to-slate-950 border border-slate-800 dark:border-white/[0.1] shadow-inner"
        >
          {/* Background 3D Image Base with Cinematic Clarity */}
          <img
            src="/images/hero-3d-learning.jpg"
            alt="EduSphere 3D Interactive Space"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000';
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-100 group-hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Interactive 3D Canvas Orbitals */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Radial Ambient Center Glow */}
          <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Lower Card Action Bar */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 px-2 font-medium">
          <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-bold">
            <FiStar className="w-3.5 h-3.5 fill-amber-400" />
            <span>4.9 / 5.0</span>
            <span className="text-slate-400 font-normal">(Verified Masterclasses)</span>
          </div>
          <Link
            to="/courses"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Explore Catalog</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Floating 3D Satellite 1: Top Right (Layer Z: 85px) */}
        <motion.div
          style={{
            x: layerTopX,
            y: layerTopY,
            transform: 'translateZ(85px)',
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -right-2 sm:-right-4 z-30 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/[0.14] backdrop-blur-xl shadow-xl dark:shadow-2xl flex items-center gap-2.5"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md">
            <FiUsers className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
              {activeStudents.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Active Learners</p>
          </div>
        </motion.div>

        {/* Floating 3D Satellite 2: Bottom Right (Layer Z: 85px) */}
        <motion.div
          style={{
            x: layerTopX,
            y: layerTopY,
            transform: 'translateZ(85px)',
          }}
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="absolute -bottom-4 -right-2 sm:-right-4 z-30 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/[0.14] backdrop-blur-xl shadow-xl dark:shadow-2xl flex items-center gap-2.5"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
            <FiAward className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
              {certificatesAwarded.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Verified Credentials</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
