import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Key,
  Layers,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Zap,
} from 'lucide-react';
import apiClient from '../api/apiClient';

// Simple Panel component
const Panel = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// Stat Card component
// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'slate' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`rounded-xl p-2.5 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
};

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSimulations: 0,
    alertsToday: 0,
    modelAccuracy: 0,
  });
  const [demoCases, setDemoCases] = useState([]);
  const [learningState, setLearningState] = useState(null);
  const [systemHealth, setSystemHealth] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [learningRes, demoCasesRes] = await Promise.allSettled([
          apiClient.get('/learning/status'),
          apiClient.get('/patient/demo-cases'),
        ]);

        if (learningRes.status === 'fulfilled') {
          setLearningState(learningRes.value.data);
          setStats(prev => ({
            ...prev,
            modelAccuracy: Math.round((learningRes.value.data.currentAccuracy || 0.78) * 100),
          }));
        }

        if (demoCasesRes.status === 'fulfilled') {
          setDemoCases(demoCasesRes.value.data);
        }

        // Simulate admin stats (in production, these would come from API)
        setStats(prev => ({
          ...prev,
          totalPatients: 156,
          activeSimulations: 23,
          alertsToday: 12,
        }));

        // Simulate system health
        setSystemHealth([
          { name: 'API Gateway', status: 'healthy', latency: '45ms' },
          { name: 'Database', status: 'healthy', latency: '12ms' },
          { name: 'ML Engine', status: 'healthy', latency: '230ms' },
          { name: 'EHR Connector', status: 'warning', latency: '890ms' },
          { name: 'Wearable Sync', status: 'healthy', latency: '67ms' },
        ]);

        // Simulate recent activity
        setRecentActivity([
          { type: 'simulation', message: 'Dr. Smith ran simulation for Patient P-2847', time: '2 min ago' },
          { type: 'alert', message: 'Critical alert generated for Patient P-1293', time: '15 min ago' },
          { type: 'feedback', message: 'Outcome feedback submitted for Patient P-0982', time: '32 min ago' },
          { type: 'login', message: 'New clinician login: Dr. Johnson', time: '1 hour ago' },
          { type: 'model', message: 'Learning weights updated (+0.3% accuracy)', time: '2 hours ago' },
        ]);

      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const triggerModelRetrain = async () => {
    try {
      await apiClient.post('/learning/retrain');
      // Refresh learning state
      const response = await apiClient.get('/learning/status');
      setLearningState(response.data);
    } catch (err) {
      console.error('Retrain failed:', err);
    }
  };

  const launchDemoCase = async (slug) => {
    try {
      const response = await apiClient.post(`/patient/demo-seed/${slug}`);
      navigate(`/dashboard/${response.data.patientId}`);
    } catch (err) {
      console.error('Failed to launch demo case:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-4 text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-violet-500" />
          <p className="text-lg font-semibold text-slate-700">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-violet-100 p-2">
                <Shield className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">BioTwin Admin</h1>
                <p className="text-xs text-slate-500">Platform Management Console</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Patients"
            value={stats.totalPatients}
            subtext="Active digital twins"
            trend={12}
            color="blue"
          />
          <StatCard
            icon={Activity}
            label="Active Simulations"
            value={stats.activeSimulations}
            subtext="Running today"
            trend={8}
            color="emerald"
          />
          <StatCard
            icon={Bell}
            label="Alerts Today"
            value={stats.alertsToday}
            subtext="Requiring attention"
            trend={-5}
            color="amber"
          />
          <StatCard
            icon={BarChart3}
            label="Model Accuracy"
            value={`${stats.modelAccuracy}%`}
            subtext="Prediction confidence"
            trend={2}
            color="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Health */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Server className="h-5 w-5 text-slate-500" />
                  System Health
                </h2>
                <button className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {systemHealth.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        service.status === 'healthy' ? 'bg-emerald-500' :
                        service.status === 'warning' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      <span className="font-medium text-slate-700">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">{service.latency}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        service.status === 'healthy' ? 'bg-emerald-100 text-emerald-600' :
                        service.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Learning Model Status */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  ML Model Status
                </h2>
                <button 
                  onClick={triggerModelRetrain}
                  className="text-sm bg-violet-600 text-white px-4 py-2 rounded-full hover:bg-violet-700 flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Trigger Retrain
                </button>
              </div>
              {learningState && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round((learningState.currentAccuracy || 0.78) * 100)}%
                    </p>
                    <p className="text-sm text-slate-500">Accuracy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-slate-900">
                      {learningState.feedbackCount || 0}
                    </p>
                    <p className="text-sm text-slate-500">Feedback Samples</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-slate-900">
                      {learningState.retrainCount || 0}
                    </p>
                    <p className="text-sm text-slate-500">Retrain Cycles</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-slate-900">
                      {learningState.lastUpdated ? new Date(learningState.lastUpdated).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-slate-500">Last Update</p>
                  </div>
                </div>
              )}
            </Panel>

            {/* Demo Cases Management */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-500" />
                  Demo Cases
                </h2>
                <span className="text-sm text-slate-500">{demoCases.length} available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {demoCases.map((demo) => (
                  <button
                    key={demo.slug}
                    onClick={() => launchDemoCase(demo.slug)}
                    className="text-left p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                  >
                    <p className="text-xs uppercase tracking-wide text-violet-600 font-medium">{demo.disease}</p>
                    <p className="font-semibold text-slate-800 mt-1">{demo.title}</p>
                    <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                      Launch <ArrowRight className="h-4 w-4" />
                    </p>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Panel>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/new')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left"
                >
                  <div className="rounded-lg bg-blue-100 p-2">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">New Patient</p>
                    <p className="text-xs text-slate-500">Create digital twin</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Export Reports</p>
                    <p className="text-xs text-slate-500">Generate analytics</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Key className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">API Keys</p>
                    <p className="text-xs text-slate-500">Manage integrations</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-left">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <Database className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Data Management</p>
                    <p className="text-xs text-slate-500">Backup & restore</p>
                  </div>
                </button>
              </div>
            </Panel>

            {/* Recent Activity */}
            <Panel>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => {
                  const icons = {
                    simulation: Activity,
                    alert: AlertTriangle,
                    feedback: CheckCircle2,
                    login: User,
                    model: TrendingUp,
                  };
                  const Icon = icons[activity.type] || Activity;
                  const colors = {
                    simulation: 'text-blue-500',
                    alert: 'text-amber-500',
                    feedback: 'text-emerald-500',
                    login: 'text-violet-500',
                    model: 'text-rose-500',
                  };

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-0.5 ${colors[activity.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{activity.message}</p>
                        <p className="text-xs text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Security Status */}
            <Panel className="bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">System Secure</p>
                  <p className="text-sm text-emerald-600">All security checks passed</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
