import React from 'react';
import { TabType } from '../types';

interface FooterProps {
  onNavigateTab: (tab: TabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab }) => {
  return (
    <footer className="bg-red-950 text-amber-200/80 border-t border-amber-500/30 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <div>
          <p className="font-bold text-amber-100 text-sm font-serif">Rathore Rishtey & Directory Portal</p>
          <p className="mt-1">Dedicated digital platform for Rathore Samaj families and local shop owners.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <button 
            onClick={() => { onNavigateTab('matrimony'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className="hover:text-amber-300 cursor-pointer transition-colors"
          >
            Matrimony
          </button>
          <button 
            onClick={() => { onNavigateTab('directory'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className="hover:text-amber-300 cursor-pointer transition-colors"
          >
            Business Ads
          </button>
          <button 
            onClick={() => { onNavigateTab('booklet'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className="hover:text-amber-300 cursor-pointer transition-colors"
          >
            E-Booklet
          </button>
          <button 
            onClick={() => { onNavigateTab('events'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className="hover:text-amber-300 cursor-pointer transition-colors"
          >
            Samaj Events
          </button>
        </div>
      </div>
    </footer>
  );
};
