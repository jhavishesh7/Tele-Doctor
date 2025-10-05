import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, PatientProfile } from '../../lib/supabase';

export default function PatientProfileView({ profile }: { profile: any }) {
  const { profile: ctxProfile } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loadingConsults, setLoadingConsults] = useState(true);
  const [selectedConsult, setSelectedConsult] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);

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
    let mounted = true;
    const loadConsults = async () => {
      setLoadingConsults(true);
      try {
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;

        // fetch consultations with exact count for pagination
        const { data, count, error } = await supabase
          .from('consultations')
          .select('*', { count: 'exact' })
          .eq('patient_id', patient?.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('Failed to load consultations', error);
          if (mounted) setConsultations([]);
        } else {
          if (mounted) {
            setConsultations(data || []);
            setTotalCount(count ?? 0);
          }
        }
      } catch (err) {
        console.error('Failed to load consultations', err);
      } finally {
        if (mounted) setLoadingConsults(false);
      }
    };

    if (patient?.id) loadConsults();
    return () => { mounted = false; };
  }, [patient, page, pageSize]);

  // CSV helpers
  const toCSV = (rows: any[]) => {
    if (!rows || rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const header = keys.join(',');
    const lines = rows.map(r => keys.map(k => {
      const v = r[k] == null ? '' : String(r[k]).replace(/"/g, '""');
      return `"${v}"`;
    }).join(','));
    return [header, ...lines].join('\n');
  };

  const downloadCSV = (rows: any[], filename = 'export') => {
    const csv = toCSV(rows);
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVAll = async (patientId?: string) => {
    if (!patientId) return;
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to download all consultations', error);
      return;
    }

    downloadCSV(data || [], 'consultations_all');
  };

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
          <h3 className="text-lg font-semibold text-gray-900">Consultations</h3>
          <p className="text-sm text-gray-500">Recent summaries</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Consultations</h3>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">Recent summaries</p>
            <button
              onClick={() => downloadCSV(consultations, 'consultations_page_' + page)}
              className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm"
            >
              Download Page CSV
            </button>
            <button
              onClick={() => downloadCSVAll(patient?.id)}
              className="px-3 py-1 rounded-lg bg-gray-50 text-gray-700 text-sm border border-gray-200"
            >
              Download All
            </button>
          </div>
        </div>

        {loadingConsults ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No consultations yet</div>
        ) : (
          <div className="grid gap-3">
            {consultations.map((c) => (
              <div key={c.id} className="border rounded-lg p-3 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-800 font-medium">{new Date(c.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-1 truncate">{(c.symptoms || 'No summary') as string}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedConsult(c)} className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-sm">View</button>
                  <button onClick={() => downloadCSV([c], 'consultation_' + c.id)} className="px-3 py-1 rounded-lg bg-gray-50 text-gray-700 text-sm border border-gray-200">Download</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">{totalCount === 0 ? 'No records' : `${(page-1)*pageSize + 1} - ${Math.min(page*pageSize, totalCount)} of ${totalCount}`}</div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded">
              {[6, 12, 24].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded bg-white">Previous</button>
            <button disabled={page*pageSize >= totalCount} onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded bg-white">Next</button>
          </div>
        </div>
      </div>

      {selectedConsult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">Consultation Details</h3>
              <button onClick={() => setSelectedConsult(null)} className="text-gray-600">Close</button>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <strong>Symptoms:</strong>
                <p className="mt-1">{selectedConsult.symptoms || '—'}</p>
              </div>
              <div>
                <strong>Medicines:</strong>
                <p className="mt-1">{selectedConsult.medicines || '—'}</p>
              </div>
              <div>
                <strong>Advice:</strong>
                <p className="mt-1">{selectedConsult.additional_advice || '—'}</p>
              </div>
              <div>
                <strong>Follow-up:</strong>
                <p className="mt-1">{selectedConsult.follow_up ? `Yes — ${selectedConsult.follow_up_date ? new Date(selectedConsult.follow_up_date).toLocaleDateString() : 'Date not set'}` : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
