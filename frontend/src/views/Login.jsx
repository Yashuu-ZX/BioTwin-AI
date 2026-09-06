import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight, Zap } from 'lucide-react';
import apiClient from '@/api/apiClient';

const DEMO_EMAIL = 'doctor@biotwin.ai';
const DEMO_PASSWORD = 'password123';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const doLogin = async (loginEmail, loginPassword) => {
    const response = await apiClient.post('/auth/login', {
      email: loginEmail,
      password: loginPassword,
    });
    const { token, user } = response.data;
    localStorage.setItem('biotwin_token', token);
    localStorage.setItem('biotwin_user', JSON.stringify(user));
    router.push('/doctor');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await doLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  // One-click: seed then immediately login — no second step needed
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    setStatusMsg('Seeding demo account...');
    try {
      // Step 1: Seed (safe to call even if already seeded)
      await apiClient.post('/auth/seed').catch(() => {
        // Seed failure is non-fatal — demo credentials always work on the backend
      });

      // Step 2: Login immediately with demo credentials
      setStatusMsg('Authenticating...');
      await doLogin(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed. Please try again.');
      setStatusMsg('');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,255,102,0.26),_transparent_32%),linear-gradient(180deg,_#edf5e8_0%,_#deefd2_100%)] text-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-[#f6f3ee]/95 shadow-[0_24px_80px_rgba(80,110,88,0.12)] p-8 md:p-10">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-2xl bg-lime-100 p-4 text-lime-700">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinical Login</h1>
          <p className="mt-2 text-sm text-slate-500">Secure access for authorized clinical staff.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-white p-3.5 text-slate-900 transition focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
              placeholder="doctor@biotwin.ai"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-black/10 bg-white p-3.5 text-slate-900 transition focus:border-lime-500 focus:outline-none focus:ring-2 focus:ring-lime-500/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        {/* One-click demo login */}
        <div className="mt-6 border-t border-black/5 pt-6">
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading || loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-lime-400 bg-lime-50 py-3.5 font-semibold text-lime-800 transition hover:bg-lime-100 disabled:opacity-70"
          >
            {demoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMsg || 'Loading...'}</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Demo Login (One Click) <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Instantly logs in as <span className="font-mono">doctor@biotwin.ai</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
