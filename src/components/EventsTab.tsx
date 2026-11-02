import React, { useState } from 'react';
import { Calendar, MapPin, ExternalLink, PlusCircle, X, Users, Phone } from 'lucide-react';
import { SamajEvent } from '../types';

interface EventsTabProps {
  events: SamajEvent[];
  onAddEvent: (event: SamajEvent) => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ events, onAddEvent }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '10:00 AM - 5:00 PM',
    location: '',
    venue: '',
    description: '',
    link: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.location) return;

    onAddEvent({
      id: Date.now(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      venue: newEvent.venue || newEvent.location,
      description: newEvent.description,
      link: newEvent.link || undefined,
      badge: 'Community Announcement'
    });

    setShowAddModal(false);
    setNewEvent({
      title: '',
      date: '',
      time: '10:00 AM - 5:00 PM',
      location: '',
      venue: '',
      description: '',
      link: ''
    });
    alert('🎉 Community event announcement posted successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left py-2">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-3xl font-serif font-bold text-stone-900">Samaj Sammelans & News</h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light">
            Stay updated with upcoming matrimonial meets, adhyaksh notices, and community gatherings across regions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-[#380812] to-[#540e1b] hover:from-[#24050b] hover:to-[#380812] text-amber-200 font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2 shrink-0 cursor-pointer border border-amber-500/20 transition-all hover:scale-102"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" /> Post Event Notice
        </button>
      </div>
      
      {/* EVENTS GRID */}
      {events.length === 0 ? (
        <p className="text-xs text-stone-500 text-center py-8">No community events posted right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev, idx) => (
            <div 
              key={ev.id || idx}
              className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5 border-l-4 border-l-[#380812] hover:shadow-md hover:border-amber-400/50 transition-all"
            >
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-stone-900 text-base font-serif">{ev.title}</h4>
                <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 shrink-0">
                  {ev.date}
                </span>
              </div>

              {/* ZERO-PILL METADATA LINE */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  {ev.location}
                </span>
                {ev.time && (
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    {ev.time}
                  </span>
                )}
              </div>

              <div 
                className="text-xs text-stone-600 leading-relaxed font-sans space-y-1"
                dangerouslySetInnerHTML={{ __html: ev.description }}
              />
              
              {ev.link && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <a 
                    href={ev.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-102 transition-transform"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Register via Official Form Link
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* POST EVENT MODAL */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAddModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-serif font-bold text-red-950 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-700" /> Post Samaj Event Announcement
            </h2>
            <p className="text-xs text-slate-500 mb-4">Inform Rathore Samaj families about upcoming sammelans and meets.</p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event / Sammelan Title *</label>
                <input 
                  required 
                  type="text" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="e.g. Rathore Samaj Parichay Sammelan" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input 
                    required 
                    type="text" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                    placeholder="e.g. 15th December 2026" 
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Time</label>
                  <input 
                    type="text" 
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-2.5 border rounded-xl border-amber-300" 
                    placeholder="10:00 AM - 5:00 PM" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location & City *</label>
                <input 
                  required 
                  type="text" 
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300" 
                  placeholder="e.g. Khargone, Madhya Pradesh" 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description & Contact Persons *</label>
                <textarea 
                  required 
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300 focus:ring-2 focus:ring-amber-500" 
                  placeholder="Organizer details, contact numbers for sammelan registration..." 
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Registration Link (Optional)</label>
                <input 
                  type="url" 
                  value={newEvent.link}
                  onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                  className="w-full p-2.5 border rounded-xl border-amber-300" 
                  placeholder="https://..." 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-red-900 hover:bg-red-800 text-amber-100 font-bold py-3 rounded-xl shadow mt-2 cursor-pointer transition-colors"
              >
                Publish Event Notice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
