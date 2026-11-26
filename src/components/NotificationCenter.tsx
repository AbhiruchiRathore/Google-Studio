import React, { useEffect, useRef } from 'react';
import {
  Bell,
  Calendar,
  CheckCheck,
  Heart,
  MessageCircle,
  Sparkles,
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';
import { AppNotification, NotificationTargetTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatRelativeNotificationTime } from '../utils/firestoreNotifications';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectNotification: (notification: AppNotification) => void;
  onMarkAllRead: () => void;
  onClearRead: () => void;
  variant?: 'header' | 'surface';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onSelectNotification,
  onMarkAllRead,
  onClearRead,
  variant = 'header'
}) => {
  const { lang, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const readCount = notifications.filter((n) => n.read).length;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getTypeVisual = (type: AppNotification['type']) => {
    switch (type) {
      case 'message':
        return {
          icon: <MessageCircle className="w-4 h-4 text-emerald-700" />,
          bg: 'bg-emerald-100 border-emerald-200'
        };
      case 'like':
        return {
          icon: <Heart className="w-4 h-4 text-rose-600 fill-rose-500" />,
          bg: 'bg-rose-100 border-rose-200'
        };
      case 'event':
        return {
          icon: <Calendar className="w-4 h-4 text-amber-800" />,
          bg: 'bg-amber-100 border-amber-200'
        };
      case 'update':
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-[#851834]" />,
          bg: 'bg-rose-50 border-rose-200'
        };
    }
  };

  const buttonClasses =
    variant === 'header'
      ? 'relative p-2 rounded-xl text-amber-100 hover:text-white hover:bg-white/10 border border-amber-400/30 transition-all cursor-pointer shrink-0'
      : 'relative p-2 sm:p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer shrink-0';

  const badgeClasses =
    variant === 'header'
      ? 'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-400 text-[#4c0d1b] text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm border border-[#6e1628]'
      : 'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#851834] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={buttonClasses}
        aria-label={t('Notifications', 'सूचनाएं')}
        aria-expanded={isOpen}
      >
        <Bell className={variant === 'header' ? 'w-4 h-4 sm:w-[18px] sm:h-[18px]' : 'w-4 h-4'} />
        {unreadCount > 0 && (
          <span className={badgeClasses}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 sm:bg-transparent"
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            className="fixed inset-x-3 top-[calc(4.4rem+var(--sat))] sm:inset-x-auto sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-[24rem] max-w-md mx-auto sm:mx-0 bg-white text-stone-800 rounded-3xl shadow-2xl border border-rose-100 z-50 overflow-hidden animate-in fade-in"
            role="dialog"
            aria-label={t('Notifications Feed', 'सूचना सूची')}
          >
            {/* Header Bar */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#6e1628] to-[#851834] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-serif font-bold text-sm truncate">
                  {t('Notifications', 'सूचनाएं')}
                </span>
                {unreadCount > 0 && (
                  <span className="bg-amber-300 text-[#4c0d1b] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                    {unreadCount} {t('new', 'नया')}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={t('Close', 'बंद करें')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Toolbar */}
            {(unreadCount > 0 || readCount > 0) && (
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-2 text-[11px]">
                <div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="inline-flex items-center gap-1 text-[#851834] hover:text-[#6e1628] font-bold cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{t('Mark all as read', 'सभी को पढ़ा हुआ मानें')}</span>
                    </button>
                  )}
                </div>
                <div>
                  {readCount > 0 && (
                    <button
                      type="button"
                      onClick={onClearRead}
                      className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('Clear read', 'पढ़ी हुई हटाएं')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notification List */}
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-[#851834] mx-auto flex items-center justify-center">
                    <Bell className="w-5 h-5 opacity-70" />
                  </div>
                  <p className="text-xs font-semibold text-stone-600">
                    {t('You are all caught up!', 'अभी कोई नई सूचना नहीं है।')}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {t(
                      'New messages, profile likes, Samaj events, and app updates appear here.',
                      'नए संदेश, प्रोफ़ाइल पसंद, समाज कार्यक्रम और ऐप अपडेट यहाँ दिखेंगे।'
                    )}
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const visual = getTypeVisual(n.type);
                  const displayTitle = lang === 'hi' && n.titleHi ? n.titleHi : n.title;
                  const displayBody = lang === 'hi' && n.bodyHi ? n.bodyHi : n.body;
                  const relativeTime = formatRelativeNotificationTime(n.createdAtMs, lang);

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        onSelectNotification(n);
                        onClose();
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                        n.read
                          ? 'bg-white hover:bg-stone-50/90'
                          : 'bg-rose-50/55 hover:bg-rose-50/90'
                      }`}
                    >
                      {n.actorPhoto ? (
                        <img
                          src={n.actorPhoto}
                          alt={n.actorName || displayTitle}
                          className="w-9 h-9 rounded-xl object-cover object-top border border-rose-200 shrink-0 mt-0.5"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${visual.bg}`}
                        >
                          {visual.icon}
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-xs leading-snug line-clamp-1 ${
                              n.read ? 'font-semibold text-stone-700' : 'font-bold text-stone-900'
                            }`}
                          >
                            {displayTitle}
                          </span>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0 pt-0.5">
                            {relativeTime}
                          </span>
                        </div>

                        <p
                          className={`text-[11px] leading-relaxed line-clamp-2 ${
                            n.read ? 'text-stone-500' : 'text-stone-700 font-medium'
                          }`}
                        >
                          {displayBody}
                        </p>
                      </div>

                      {!n.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#851834] shrink-0 mt-2"
                          aria-label={t('Unread', 'अपठित')}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface AppUpdateDetailsModalProps {
  notification: AppNotification | null;
  onClose: () => void;
  onNavigateTab: (tab: NotificationTargetTab) => void;
}

export const AppUpdateDetailsModal: React.FC<AppUpdateDetailsModalProps> = ({
  notification,
  onClose,
  onNavigateTab
}) => {
  const { lang, t } = useLanguage();

  if (!notification) return null;

  const title = lang === 'hi' && notification.titleHi ? notification.titleHi : notification.title;
  const body = lang === 'hi' && notification.bodyHi ? notification.bodyHi : notification.body;

  const getTabLabel = (tab: NotificationTargetTab) => {
    switch (tab) {
      case 'matrimony':
        return t('Explore Matrimony Bios', 'वैवाहिक बायोडाटा देखें');
      case 'events':
        return t('View Samaj Events', 'समाज कार्यक्रम देखें');
      case 'directory':
        return t('Open Business Directory', 'व्यापार निर्देशिका खोलें');
      case 'booklet':
        return t('Open E-Booklet', 'ई-पत्रिका खोलें');
      case 'kundali':
        return t('Open Kundali Milan', 'कुंडली मिलान खोलें');
      case 'guest-list':
        return t('Open Guest List', 'अतिथि सूची खोलें');
      case 'dashboard':
      default:
        return t('Open Dashboard', 'डैशबोर्ड खोलें');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#6e1628] to-[#851834] text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-300 text-[#4c0d1b] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-amber-200">
                  {t('App Update', 'ऐप अपडेट')}
                </span>
                {notification.version && (
                  <span className="text-[10px] font-extrabold bg-amber-400 text-[#4c0d1b] px-1.5 py-0.5 rounded-md">
                    {notification.version}
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-base truncate">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label={t('Close', 'बंद करें')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-400 font-medium">
            {formatRelativeNotificationTime(notification.createdAtMs, lang)}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
            {body}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
            >
              {t('Close', 'बंद करें')}
            </button>
            {notification.targetTab && (
              <button
                type="button"
                onClick={() => {
                  const target = notification.targetTab;
                  onClose();
                  if (target) onNavigateTab(target);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6e1628] to-[#851834] text-amber-200 text-xs font-bold shadow cursor-pointer"
              >
                <span>{getTabLabel(notification.targetTab)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
