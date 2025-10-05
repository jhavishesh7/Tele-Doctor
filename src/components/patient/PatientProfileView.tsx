import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, PatientProfile } from '../../lib/supabase';

export default function PatientProfileView({ profile }: { profile: any }) {
  const { profile: ctxProfile } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ phone: '', date_of_birth: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', (profile || ctxProfile).id)
          .maybeSingle();

        if (mounted) setPatient(data || null);
      } catch (err) {
        console.error('Failed to load patient profile', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [profile, ctxProfile]);

  useEffect(() => {
    // when patient loads populate form for editing
    if (patient) {
      setForm({
        phone: patient.phone || '',
        date_of_birth: patient.date_of_birth || '',
        address: patient.address || '',
      });
    }
    // no cleanup needed here
  }, [patient,]);

  // profile edit helpers handled below

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
      <p className="text-gray-600 mb-6">Manage your personal information</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-gray-600">{profile.email}</p>
              </div>
              <div>
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-100">{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</span>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-800 mt-1">{patient?.phone || '—'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">Date of Birth</p>
                <p className="text-sm text-gray-800 mt-1">{patient?.date_of_birth || '—'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-800 mt-1">{patient?.address || '—'}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">About</h3>
              <p className="text-sm text-gray-600 mt-2">Additional patient details and medical history will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Profile Details</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditMode(!editMode)} className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm">
              {editMode ? 'View' : 'Edit'}
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

        {!editMode ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-800 mt-1">{patient?.phone || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="text-sm text-gray-800 mt-1">{patient?.date_of_birth || '—'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-sm text-gray-800 mt-1">{patient?.address || '—'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError(''); setSuccess(''); setSaving(true);
            try {
              // try update
              const updates = { phone: form.phone, date_of_birth: form.date_of_birth || null, address: form.address };
              const { error: updateError } = await supabase.from('patient_profiles').update(updates).eq('user_id', (profile || ctxProfile).id);
              if (updateError) {
                // fallback to insert
                await supabase.from('patient_profiles').insert({ user_id: (profile || ctxProfile).id, ...updates });
              }
              setSuccess('Profile saved');
              // refresh
              const { data } = await supabase.from('patient_profiles').select('*').eq('user_id', (profile || ctxProfile).id).maybeSingle();
              setPatient(data || null);
              setEditMode(false);
            } catch (err: any) {
              setError(err.message || 'Failed to save profile');
            } finally {
              setSaving(false);
            }
          }} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </div>

      {/* consultations removed from profile view */}
    </div>
  );
}
