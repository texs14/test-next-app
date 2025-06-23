import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { motion } from 'framer-motion';

interface DraggableWordProps {
  id: string;
  text: string;
  onClick?: () => void;
  isPlaced?: boolean;
}

export const ItemTypes = {
  WORD: 'word',
};

export const DraggableWord: React.FC<DraggableWordProps> = ({ 
  id, 
  text, 
  onClick, 
  isPlaced = false 
}) => {
  const dragRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.WORD,
    item: { id, text },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Подключаем drag к ref
  drag(dragRef);

  return (
    <motion.div
      ref={dragRef}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-block px-4 py-2 m-1 rounded-xl text-white font-medium cursor-move shadow-lg
        transition-all duration-200 select-none
        ${isPlaced 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
          : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
        }
        ${isDragging ? 'shadow-2xl transform rotate-2' : 'hover:shadow-xl'}
      `}
      style={{
        transform: isDragging ? 'rotate(5deg)' : 'rotate(0deg)',
      }}
    >
      {text}
    </motion.div>
  );
}; 