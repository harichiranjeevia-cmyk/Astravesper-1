import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_CATEGORIES } from '../data/catalog';

function emailToDocId(email: string): string {
  const normalized = email.trim().toLowerCase();
  const safe = normalized.replace(/[^a-z0-9]/g, '_').slice(0, 100);
  return `mem_${safe}`;
}

export function MembershipForm() {
  const { firebaseUser, updateProfileData, logActivity } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(firebaseUser?.displayName || '');
  const [email, setEmail] = useState(firebaseUser?.email || '');
  const [preferredUsername, setPreferredUsername] = useState(
    firebaseUser?.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '') || ''
  );
  const [interests, setInterests] = useState<string[]>(['Productivity']);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (cat: string) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = preferredUsername.trim();

    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(cleanUser)) {
      setError(
        'Preferred username must be 2–40 characters using letters, numbers, dots, underscores, or hyphens.'
      );
      return;
    }
    if (interests.length === 0) {
      setError('Please select at least one area of interest.');
      return;
    }
    if (!consent) {
      setError('Please accept the Astra Vesper Privacy Policy to join.');
      return;
    }

    setSubmitting(true);
    try {
      const memId = emailToDocId(cleanEmail);
      const memRef = doc(db, 'memberships', memId);
      const payload: Record<string, unknown> = {
        email: cleanEmail,
        fullName: cleanName.slice(0, 120),
        preferredUsername: cleanUser.slice(0, 40),
        interests: interests.slice(0, 10),
        consentAccepted: true,
        createdAt: serverTimestamp(),
      };
      if (message.trim()) {
        payload.message = message.trim().slice(0, 1000);
      }
      if (firebaseUser?.uid && firebaseUser.emailVerified) {
        payload.userId = firebaseUser.uid;
      }

      await setDoc(memRef, payload);

      if (firebaseUser && firebaseUser.emailVerified) {
        await updateProfileData({ membershipStatus: 'member' }).catch(() => null);
        await logActivity('Joined Astra Vesper Membership', cleanUser, 'membership').catch(
          () => null
        );
      }
      setSubmitted(true);
      toast({
        variant: 'success',
        title: 'Membership confirmed',
        description: `Welcome to Astra Vesper, ${cleanUser}.`,
      });
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('permission') || msg.includes('already')) {
        setError(
          'This email address is already registered in the Astra Vesper membership community.'
        );
      } else {
        setError('Unable to submit membership right now. Please try again.');
      }
      toast({
        variant: 'warning',
        title: 'Membership submission could not complete',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <h3 className="font-display text-lg font-semibold">
            Welcome to Astra Vesper
          </h3>
        </div>
        <p className="text-sm text-[#4b5563] dark:text-slate-300 leading-relaxed">
          Your membership profile for <span className="font-medium text-[#0b0c10] dark:text-white">{email}</span> is confirmed. You will receive updates on upcoming Vioratundra releases and early access opportunities.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
        >
          Register another address
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 sm:p-8 space-y-5"
    >
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="mem-name" className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
            Full Name
          </label>
          <input
            id="mem-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
            className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="mem-email" className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
            Email Address
          </label>
          <input
            id="mem-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mem-username" className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
          Preferred Username
        </label>
        <input
          id="mem-username"
          type="text"
          required
          value={preferredUsername}
          onChange={(e) => setPreferredUsername(e.target.value)}
          placeholder="alex_vesper"
          className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
        />
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
          Areas of Interest
        </span>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map((cat) => {
            const active = interests.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleInterest(cat)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-[#f8f9fa] dark:bg-[#181c26] border-black/10 dark:border-white/10 text-[#4b5563] dark:text-slate-300 hover:border-violet-500/40'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mem-msg" className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
          Optional Message
        </label>
        <textarea
          id="mem-msg"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you are most excited to explore in the Vioratundra ecosystem..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-black/20 text-violet-600 focus:ring-violet-600"
        />
        <span className="text-xs leading-relaxed text-[#4b5563] dark:text-slate-400">
          I agree to receive Astra Vesper ecosystem updates and early-access notices in accordance with the{' '}
          <Link to="/support/privacy" className="text-violet-700 dark:text-violet-400 underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Join Astra Vesper'}
      </button>
    </form>
  );
}
