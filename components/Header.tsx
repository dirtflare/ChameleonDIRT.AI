import React from 'react';
import { LogoIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-8 h-8 text-violet-400" />
            <h1 className="text-xl font-bold text-gray-100 tracking-tight">
              Chameleon DIRT.AI
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};