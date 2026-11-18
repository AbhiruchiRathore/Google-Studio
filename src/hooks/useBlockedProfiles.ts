import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthSession, BlockedProfileRecord, MatrimonyProfile } from '../types';
import { getUserStorageKey } from '../utils/profileOwnership';

export function useBlockedProfiles(authSession: AuthSession | null) {
  const storageKey = getUserStorageKey('samaj_blocked_profiles', authSession);

  const [blockedList, setBlockedList] = useState<BlockedProfileRecord[]>(() => {
    if (!authSession || typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!authSession || typeof window === 'undefined') {
      setBlockedList([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setBlockedList(Array.isArray(parsed) ? parsed : []);
    } catch {
      setBlockedList([]);
    }
  }, [authSession, storageKey]);

  const persist = useCallback(
    (next: BlockedProfileRecord[]) => {
      setBlockedList(next);
      if (!authSession || typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving blocked profiles:', e);
      }
    },
    [authSession, storageKey]
  );

  const blockedIds = useMemo(
    () => new Set(blockedList.map((b) => b.id.toString())),
    [blockedList]
  );

  const isProfileBlocked = useCallback(
    (id: number | string) => blockedIds.has(id.toString()),
    [blockedIds]
  );

  const blockProfile = useCallback(
    (profile: Pick<MatrimonyProfile, 'id' | 'name' | 'gotra' | 'city' | 'photo' | 'gender'>) => {
      if (!authSession) return;
      const targetId = profile.id.toString();
      setBlockedList((prev) => {
        if (prev.some((b) => b.id.toString() === targetId)) return prev;
        const entry: BlockedProfileRecord = {
          id: targetId,
          name: profile.name,
          gotra: profile.gotra,
          city: profile.city,
          photo: profile.photo,
          gender: profile.gender,
          blockedAt: new Date().toISOString()
        };
        const next = [entry, ...prev];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          console.error('Error saving blocked profile:', e);
        }
        return next;
      });
    },
    [authSession, storageKey]
  );

  const unblockProfile = useCallback(
    (id: number | string) => {
      if (!authSession) return;
      const targetId = id.toString();
      setBlockedList((prev) => {
        const next = prev.filter((b) => b.id.toString() !== targetId);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          console.error('Error removing blocked profile:', e);
        }
        return next;
      });
    },
    [authSession, storageKey]
  );

  return {
    blockedList,
    blockedIds,
    isProfileBlocked,
    blockProfile,
    unblockProfile,
    persistBlockedList: persist
  };
}
