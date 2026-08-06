"use client";
import Dashboard from '@/views/Dashboard';
import { use } from 'react';

export default function DashboardSectionPage({ params }) {
  const resolvedParams = use(params);
  return <Dashboard role="doctor" providedId={resolvedParams.id} providedSection={resolvedParams.section} />;
}
