'use client';

import React, { useState } from 'react';

export default function PostProblemWizard() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Software & Technology',
    description: '',
    urgency: 'Medium',
    budgetMin: 500,
    budgetMax: 2500,
    visibility: 'PUBLIC',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API Call to POST /api/v1/problems
    alert('Problem submitted successfully! Matching engine initiated.');
    window.location.href = '/dashboard';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Step {step} of 3</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Describe Your Problem</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Problem Title</label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g., High peak-hour food waste due to inventory prediction delays"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Operational Impact</label>
              <textarea
                rows={5}
                required
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Describe what happens, where the bottleneck is, and what you've tried..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
              <select
                className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              >
                <option value="Low">Low (Planning for next quarter)</option>
                <option value="Medium">Medium (Affecting weekly workflow)</option>
                <option value="High">High (Immediate revenue loss)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Budget ($)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Budget ($)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 bg-slate-100 text-slate-700 font-medium py-3 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/2 bg-slate-900 text-white font-medium py-3 rounded-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visibility Mode</label>
              <div className="space-y-2">
                {[
                  { id: 'PUBLIC', label: 'Public', desc: 'Visible to all solvers and indexed in problem search.' },
                  { id: 'PRIVATE', label: 'Private', desc: 'Only visible to direct invitees and algorithmically matched solvers.' },
                  { id: 'ANONYMOUS', label: 'Anonymous until accepted', desc: 'Hides company identity until contact request accepted.' },
                ].map((mode) => (
                  <label key={mode.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={formData.visibility === mode.id}
                      onChange={() => setFormData({ ...formData, visibility: mode.id })}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{mode.label}</div>
                      <div className="text-xs text-slate-500">{mode.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/2 bg-slate-100 text-slate-700 font-medium py-3 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-1/2 bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700"
              >
                Submit Problem & Match
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
