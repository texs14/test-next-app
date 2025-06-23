import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FireworksProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  particles: Particle[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];

export const Fireworks: React.FC<FireworksProps> = ({ isActive, onComplete }) => {
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setFireworks([]);
      setShowCongrats(false);
      return;
    }

    setShowCongrats(true);
    
    const createFirework = (id: number): Firework => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = Math.random() * 3 + 2;
        particles.push({
          id: i,
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60,
          maxLife: 60,
        });
      }
      
      return { id, x, y, color, particles };
    };

    // Создаем несколько фейерверков
    const initialFireworks = Array.from({ length: 5 }, (_, i) => createFirework(i));
    setFireworks(initialFireworks);

    // Анимируем частицы
    const animateFireworks = () => {
      setFireworks(prev => 
        prev.map(firework => ({
          ...firework,
          particles: firework.particles
            .map(particle => ({
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              vy: particle.vy + 0.1, // гравитация
              life: particle.life - 1,
            }))
            .filter(particle => particle.life > 0)
        }))
        .filter(firework => firework.particles.length > 0)
      );
    };

    const interval = setInterval(animateFireworks, 16); // ~60fps

    // Завершаем через 3 секунды
    const timeout = setTimeout(() => {
      setFireworks([]);
      setShowCongrats(false);
      onComplete?.();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Фейерверки */}
      {fireworks.map(firework =>
        firework.particles.map(particle => (
          <motion.div
            key={`${firework.id}-${particle.id}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              backgroundColor: firework.color,
              opacity: particle.life / particle.maxLife,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        ))
      )}
      
      {/* Поздравительная надпись */}
      {showCongrats && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <div className="text-center">
            <motion.h1
              className="text-6xl font-bold text-white mb-4 drop-shadow-lg"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              🎉 Поздравляем! 🎉
            </motion.h1>
            <motion.p
              className="text-2xl text-white drop-shadow-lg"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              Упражнение выполнено!
            </motion.p>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 