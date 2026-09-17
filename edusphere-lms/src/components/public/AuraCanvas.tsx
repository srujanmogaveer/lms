import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface AuraCanvasProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  speed?: number;
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  alphaSpeed: number;
  hue: number;
}

export const AuraCanvas: React.FC<AuraCanvasProps> = ({
  className = 'absolute inset-0 pointer-events-none z-0',
  particleCount = 50,
  particleColor = 'rgba(129, 140, 248, ',
  speed = 0.5,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 120,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener('resize', handleResize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Initialize celestial stars and stardust
    const particles: Particle[] = [];
    // Celestial star hues: Pure Starlight White/Blue (220), Electric Violet (270), Cyan (190), Gold Nebula (45)
    const hues = isDark ? [215, 260, 195, 285, 45] : [220, 255, 205, 275, 40];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const isStarFlare = Math.random() > 0.85; // 15% bright prominent stars
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: isStarFlare ? Math.random() * 2.4 + 1.6 : Math.random() * 1.5 + 0.6,
        vx: (Math.random() - 0.5) * speed * 0.7,
        vy: (Math.random() - 0.5) * speed * 0.7,
        alpha: Math.random() * 0.6 + 0.3,
        maxAlpha: Math.random() * 0.6 + 0.4,
        alphaSpeed: (Math.random() * 0.02 + 0.006) * (Math.random() > 0.5 ? 1 : -1),
        hue: hues[Math.floor(Math.random() * hues.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Draw subtle interactive cosmic cursor glow
      if (interactive) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          320
        );
        if (isDark) {
          glowGrad.addColorStop(0, 'rgba(129, 140, 248, 0.15)');
          glowGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.07)');
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.10)');
          glowGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
          glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw and update stars
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Realistic star twinkling
        p.alpha += p.alphaSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.15) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        // Gentle stellar magnetism
        if (interactive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= (dx / dist) * force * 1.5;
            p.y -= (dy / dist) * force * 1.5;
          }
        }

        // Draw star core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const starLightness = isDark ? '82%' : '60%';
        const adjustedAlpha = isDark ? p.alpha : p.alpha * 0.8;
        ctx.fillStyle = `hsla(${p.hue}, 95%, ${starLightness}, ${adjustedAlpha})`;
        ctx.shadowBlur = isDark ? 10 : 5;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 70%, ${isDark ? '0.9' : '0.5'})`;
        ctx.fill();

        // 4-point cross diffraction flare for larger celestial stars
        if (p.size > 2.0 && isDark) {
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 90%, ${p.alpha * 0.4})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          // Horizontal spike
          ctx.moveTo(p.x - p.size * 2.5, p.y);
          ctx.lineTo(p.x + p.size * 2.5, p.y);
          // Vertical spike
          ctx.moveTo(p.x, p.y - p.size * 2.5);
          ctx.lineTo(p.x, p.y + p.size * 2.5);
          ctx.stroke();
        }

        // Connect nearby stars with subtle celestial constellation filaments
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 95) {
            const lineAlpha = (1 - dist2 / 95) * (isDark ? 0.18 : 0.09);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = isDark ? `rgba(165, 180, 252, ${lineAlpha})` : `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [particleCount, particleColor, speed, interactive, isDark]);

  return <canvas ref={canvasRef} className={className} />;
};
