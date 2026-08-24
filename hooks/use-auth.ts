'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, hasAdminAccess } from '@/lib/firebase';

export function useAuth() {
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
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return { currentUser, isAdmin };
}
