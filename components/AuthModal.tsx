'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  LogIn, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  loginWithEmail,
  loginWithGoogle,
  resetUserPassword
} from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { TRANSLATIONS, Language } from '../lib/translations';
import type { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSuccess?: (user: User) => void;
  initialMode?: 'signin' | 'reset';
}

export default function AuthModal({
  isOpen,
  onClose,
  lang,
  onSuccess,
  initialMode = 'signin'
}: AuthModalProps) {
  const t = (key: keyof typeof TRANSLATIONS['uk']) => TRANSLATIONS[lang][key] || TRANSLATIONS['uk'][key] || key;

  const [mode, setMode] = useState<'signin' | 'reset'>(initialMode === 'reset' ? 'reset' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage(t('invalidEmail'));
      return;
    }

    if (mode === 'reset') {
      try {
        setLoading(true);
        await resetUserPassword(email);
        setSuccessMessage(t('resetEmailSent'));
      } catch (err: any) {
        setErrorMessage(getFriendlyErrorMessage(err, lang));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(t('weakPassword'));
      return;
    }

    // Sign in
    try {
      setLoading(true);
      const user = await loginWithEmail(email, password);
      setSuccessMessage(t('loginSuccess'));
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setGoogleLoading(true);
      const user = await loginWithGoogle();
      setSuccessMessage(t('loginSuccess'));
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err, lang));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#FAF6EE] border border-[#E6DFD5] rounded-3xl shadow-2xl overflow-hidden"
          id="auth-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E6DFD5]/70">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#3E2F26] text-[#C09E6D] flex items-center justify-center shadow-xs">
                {mode === 'reset' ? (
                  <KeyRound className="w-5 h-5" />
                ) : (
                  <UserIcon className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-[#231913]">
                  {mode === 'reset' ? t('resetPasswordTitle') : t('signInTab')}
                </h3>
                <p className="text-xs text-[#7A6B63] font-sans">
                  {mode === 'reset' 
                    ? t('resetPasswordDesc') 
                    : (lang === 'uk' ? 'Увійдіть для доступу' : lang === 'hu' ? 'Jelentkezzen be a hozzáféréshez' : 'Sign in to your account')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#7A6B63] hover:text-[#231913] hover:bg-[#EAE2D7] rounded-full transition-colors cursor-pointer"
              aria-label={t('cancel')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Error & Success Alerts */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-[#FBEAE8] border border-[#F5C2BC] rounded-xl flex items-start gap-2.5 text-[#C53929] text-xs font-sans"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-[#EAF7ED] border border-[#BCE8C5] rounded-xl flex items-start gap-2.5 text-[#2E7D32] text-xs font-sans"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-sans font-semibold text-[#231913] mb-1">
                  {t('emailLabel')} <span className="text-[#C53929]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7970]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5CBBF] focus:border-[#C09E6D] focus:ring-2 focus:ring-[#C09E6D]/20 rounded-xl text-sm font-sans text-[#231913] outline-none transition-all"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-sans font-semibold text-[#231913]">
                      {t('passwordLabel')} <span className="text-[#C53929]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setErrorMessage(''); setSuccessMessage(''); }}
                      className="text-xs text-[#A87B43] hover:text-[#3E2F26] font-sans font-medium transition-colors cursor-pointer"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7970]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D5CBBF] focus:border-[#C09E6D] focus:ring-2 focus:ring-[#C09E6D]/20 rounded-xl text-sm font-sans text-[#231913] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7970] hover:text-[#231913] p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full mt-2 py-3 px-4 bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] font-sans font-bold text-sm rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                ) : mode === 'reset' ? (
                  <>
                    <KeyRound className="w-4 h-4 text-[#C09E6D]" />
                    <span>{t('sendResetLink')}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#C09E6D]" />
                    <span>{t('loginBtn')}</span>
                  </>
                )}
              </button>
            </form>

            {/* Google Sign-in Button - Under Email Login */}
            {mode !== 'reset' && (
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#F3EFE6] border border-[#D5CBBF] hover:border-[#C09E6D] rounded-2xl text-[#231913] font-sans font-semibold text-sm shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                  id="google-signin-btn"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#C09E6D]" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{t('loginWithGoogle')}</span>
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7A6B63] hover:text-[#231913] font-sans font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('backToLogin')}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
