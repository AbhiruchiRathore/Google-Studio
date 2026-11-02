import React from 'react';
import { Share2 } from 'lucide-react';

export const WhatsAppShare: React.FC = () => {
  const shareText = encodeURIComponent(
    "Download the digital Rathore Rishtey app to view community biodatas and local shop offers instead of the paper book! Check it out here: " + window.location.href
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a 
        href={`https://api.whatsapp.com/send?text=${shareText}`} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Share App on WhatsApp"
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-2 border-white group relative cursor-pointer"
      >
        <Share2 className="w-6 h-6" />
        
        {/* Tooltip text on hover for desktop */}
        <span className="absolute right-16 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Share App on WhatsApp
        </span>
      </a>
    </div>
  );
};
