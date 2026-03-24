import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { Chrome, Mail, Lock, LogIn, UserPlus, KeyRound, ArrowLeft, User as UserIcon } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-100"
        >
          <button 
            onClick={() => setIsForgotPassword(false)}
            className="mb-8 flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-stone-900 text-white rounded-3xl mb-6 shadow-xl">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Reset Password</h1>
            <p className="text-stone-500 font-medium">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent focus:border-stone-900 rounded-2xl outline-none transition-all font-medium"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            {message && (
              <p className="text-emerald-600 text-sm font-bold text-center bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-stone-200"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-stone-900 text-white rounded-3xl mb-6 shadow-xl">
            {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Join Focus Kar'}
          </h1>
          <p className="text-stone-500 font-medium">
            {isLogin ? 'Sign in to continue your focus journey' : 'Start building your discipline today'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-stone-100 rounded-2xl font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-stone-400 bg-white px-4">
              Or with email
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent focus:border-stone-900 rounded-2xl outline-none transition-all font-medium"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent focus:border-stone-900 rounded-2xl outline-none transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-transparent focus:border-stone-900 rounded-2xl outline-none transition-all font-medium"
              />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs font-black text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-stone-200"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-stone-100">
            <p className="text-stone-400 text-sm font-medium mb-4">
              {isLogin ? "New to Focus Kar?" : "Already have an account?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full py-3 border-2 border-stone-900 text-stone-900 rounded-xl font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all active:scale-95"
            >
              {isLogin ? "Create New Account" : "Sign In to Existing Account"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
