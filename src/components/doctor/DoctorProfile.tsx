import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, DoctorProfile, MedicalCategory } from '../../lib/supabase';
import { Save, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function DoctorProfileView() {
  const { profile } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [categories, setCategories] = useState<MedicalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    category_id: '',
    qualifications: '',
    experience_years: 0,
    bio: '',
    consultation_fee: 0,
    contact_phone: '',
    contact_email: '',
    location: '',
    is_visible: true,
  });

  useEffect(() => {
    if (profile?.role === 'doctor') {
      fetchCategories();
      fetchDoctorProfile();
    }
  }, [profile]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('medical_categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  };

  const fetchDoctorProfile = async () => {
    if (!profile) return;

    setLoading(true);
    const { data } = await supabase
      .from('doctor_profiles')
      .select('*, medical_categories(name)')
      .eq('user_id', profile.id)
      .single();

    if (data) {
      setDoctorProfile(data as any);
      setFormData({
        category_id: data.category_id,
        qualifications: data.qualifications,
        experience_years: data.experience_years,
        bio: data.bio,
        consultation_fee: data.consultation_fee,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        location: data.location,
        is_visible: data.is_visible,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // validate required fields
      if (!formData.contact_phone || !formData.location) {
        throw new Error('Contact phone and location are required');
      }

      const { error: updateError } = await supabase
        .from('doctor_profiles')
        .update(formData)
        .eq('user_id', profile?.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      fetchDoctorProfile();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your professional information</p>
      </div>

      {!doctorProfile?.is_verified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Profile Pending Verification</p>
            <p className="text-sm text-yellow-700 mt-1">
              Your profile is awaiting admin approval. Once verified, it will be visible to patients.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Specialty *
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select specialty</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualifications *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., MBBS, MD, Board Certified"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio
            </label>
            <textarea
              rows={4}
              placeholder="Tell patients about your expertise and approach..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Fee (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.consultation_fee}
              onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              placeholder="professional@example.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="City, State"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_visible}
              onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
              className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex items-center gap-2">
              {formData.is_visible ? (
                <Eye className="w-5 h-5 text-teal-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-600">
                  {formData.is_visible
                    ? 'Your profile is visible to patients'
                    : 'Your profile is hidden from patients'}
                </p>
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
