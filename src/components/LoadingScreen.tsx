import React from 'react';
import { motion } from 'motion/react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex flex-col items-center justify-center z-[100]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-indigo-500/20"
      >
        C
      </motion.div>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 120 }}
        className="h-1 bg-indigo-600 rounded-full mt-8"
      />
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
        Loading CMS Pro...
      </p>
    </div>
  );
}
