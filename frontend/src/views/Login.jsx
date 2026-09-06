import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import apiClient from '@/api/apiClient';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeded, setSeeded] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Store JWT token and user info
      localStorage.setItem('biotwin_token', token);
      localStorage.setItem('biotwin_user', JSON.stringify(user));
      
      // Redirect to Doctor Dashboard
      router.push('/doctor');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await apiClient.post('/auth/seed');
      setSeeded(true);
      setEmail('doctor@biotwin.ai');
      setPassword('password123');
    } catch (err) {
      setError('Failed to seed demo doctor account.');
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
        
        {seeded && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            Demo account created! Credentials auto-filled.
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
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        <div className="mt-8 border-t border-black/5 pt-6 text-center">
          <p className="mb-4 text-xs text-slate-500">For demonstration purposes</p>
          <button 
            onClick={handleSeed}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
          >
            Seed Demo Doctor Account <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
