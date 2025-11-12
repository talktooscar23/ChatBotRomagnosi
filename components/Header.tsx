import React from 'react';
import { RomagnosiIcon } from './icons/Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center">
        <RomagnosiIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
        <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          Romagnosi AI Assistant
        </h1>
      </div>
    </header>
  );
};

export default Header;
