"use client";
import PatientForm from '@/components/PatientForm';
import { Suspense } from 'react';

export default function NewPatientPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PatientForm />
    </Suspense>
  );
}
