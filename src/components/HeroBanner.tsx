import React from 'react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 border-b border-amber-200 px-4 py-3 text-center text-sm text-red-950 font-medium">
      <span className="bg-red-800 text-amber-100 text-xs font-bold px-2.5 py-0.5 rounded-full mr-2 shadow-xs">
        ANNUAL DIRECTORY 2026
      </span>
      <span>
        Welcome Rathore Samaj Members! Instead of printed books, access 100% verified rishta profiles & local business ads instantly.
      </span>
    </div>
  );
};
