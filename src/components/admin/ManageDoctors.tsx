import { useEffect, useState } from 'react';
import { supabase, DoctorProfile } from '../../lib/supabase';
import { CheckCircle, XCircle, CreditCard as Edit, Eye, TrendingUp } from 'lucide-react';

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [editingRank, setEditingRank] = useState<string | null>(null);
  const [rankValue, setRankValue] = useState(0);

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  const fetchDoctors = async () => {
    setLoading(true);

    let query = supabase
      .from('doctor_profiles')
      .select(`
        *,
        profiles!doctor_profiles_user_id_fkey(id, full_name, email, avatar_url),
        medical_categories(name)
      `)
      .order('created_at', { ascending: false });

    if (filter === 'verified') {
      query = query.eq('is_verified', true);
    } else if (filter === 'pending') {
      query = query.eq('is_verified', false);
    }

    const { data } = await query;

    if (data) {
      setDoctors(data as any);
    }

    setLoading(false);
  };

  const handleVerify = async (doctorId: string, userId: string, isVerified: boolean) => {
    const { error } = await supabase
      .from('doctor_profiles')
      .update({ is_verified: isVerified })
      .eq('id', doctorId);

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: isVerified ? 'Profile Verified' : 'Profile Verification Revoked',
        message: isVerified
          ? 'Your profile has been verified. Patients can now book appointments with you.'
          : 'Your profile verification has been revoked. Please contact support.',
        type: 'profile_update',
      });

      fetchDoctors();
    }
  };

  const handleVisibility = async (doctorId: string, isVisible: boolean) => {
    const { error } = await supabase
      .from('doctor_profiles')
      .update({ is_visible: isVisible })
      .eq('id', doctorId);

    if (!error) {
      fetchDoctors();
    }
  };

  const handleUpdateRank = async (doctorId: string) => {
    const { error } = await supabase
      .from('doctor_profiles')
      .update({ rank_score: rankValue })
      .eq('id', doctorId);

    if (!error) {
      setEditingRank(null);
      fetchDoctors();
    }
  };

  const startEditRank = (doctorId: string, currentRank: number) => {
    setEditingRank(doctorId);
    setRankValue(currentRank);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Doctors</h1>
        <p className="text-gray-600">Verify profiles and manage doctor rankings</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'verified', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading doctors...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600">No doctors found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors.map((doctor) => {
                  const profile = doctor.profiles as any;
                  const category = doctor.medical_categories as any;

                  return (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {profile?.full_name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Dr. {profile?.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">{profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{category?.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{doctor.experience_years} years</span>
                      </td>
                      <td className="px-6 py-4">
                        {editingRank === doctor.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={rankValue}
                              onChange={(e) => setRankValue(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              onClick={() => handleUpdateRank(doctor.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingRank(null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{doctor.rank_score}</span>
                            <button
                              onClick={() => startEditRank(doctor.id, doctor.rank_score)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doctor.is_verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {doctor.is_verified ? 'Verified' : 'Pending'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doctor.is_visible
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {doctor.is_visible ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerify(doctor.id, doctor.user_id, !doctor.is_verified)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              doctor.is_verified
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={doctor.is_verified ? 'Revoke verification' : 'Verify profile'}
                          >
                            {doctor.is_verified ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleVisibility(doctor.id, !doctor.is_visible)}
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title={doctor.is_visible ? 'Hide profile' : 'Show profile'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">About Rankings</p>
            <p className="text-sm text-blue-700 mt-1">
              The rank score determines the order in which doctors appear in search results.
              Higher scores appear first. This is not visible to patients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
