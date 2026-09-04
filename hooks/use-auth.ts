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
  // Deliberately starts as `false` on both the server and the client's first
  // render: the admin status comes from the stored Supabase session, which only
  // exists on the client. Reading localStorage synchronously in the initializer
  // made the client's first render differ from the SSR HTML (admin "key" icon
  // appeared only on the client) → hydration mismatch. The subscription below
  // restores the real status from the auth state after hydration.
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
