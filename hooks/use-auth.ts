'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { subscribeToAuth, hasAdminAccess, logoutUser } from '@/lib/supabase';

export function useAuth(onNonAdmin?: () => void) {
  const onNonAdminRef = useRef(onNonAdmin);

  useEffect(() => {
    onNonAdminRef.current = onNonAdmin;
  }, [onNonAdmin]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        sessionStorage.getItem('aura_admin_auth') === 'true' ||
        localStorage.getItem('aura_admin_auth') === 'true' ||
        localStorage.getItem('isAdmin') === 'true'
      );
    }
    return false;
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        const admin = await hasAdminAccess(user);
        setIsAdmin(admin);
        if (typeof window !== 'undefined') {
          if (admin) {
            sessionStorage.setItem('aura_admin_auth', 'true');
            localStorage.setItem('aura_admin_auth', 'true');
          } else {
            sessionStorage.removeItem('aura_admin_auth');
            localStorage.removeItem('aura_admin_auth');
            // Non-admins must not keep a session: sign them out immediately.
            await logoutUser();
            onNonAdminRef.current?.();
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return { currentUser, isAdmin };
}
