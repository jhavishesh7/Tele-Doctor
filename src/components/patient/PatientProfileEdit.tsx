import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, PatientProfile } from '../../lib/supabase';
import { uploadProfilePicture, uploadDocument } from '../../lib/storage';
import { User, Phone, MapPin, Calendar, Upload, FileText, Camera, CheckCircle, Bug } from 'lucide-react';
import { DEBUG_CONFIG, isProfileComplete as checkProfileComplete, debugLog } from '../../config/debug';

export default function PatientProfileEdit() {
  const { profile, refreshProfile } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    date_of_birth: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, [profile?.id]);

  const loadProfile = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (data) {
        setPatient(data);
        setForm({
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.error('Failed to load patient profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const { url } = await uploadProfilePicture(file, profile.id);

      await supabase
        .from('profiles')
        .update({ profile_picture_url: url })
        .eq('id', profile.id);

      await refreshProfile();
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCitizenshipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id || !patient?.id) return;

    setUploadingDoc(true);
    setError('');

    try {
      const { url } = await uploadDocument(file, profile.id, 'citizenship');

      await supabase
        .from('patient_profiles')
        .update({ citizenship_document_url: url })
        .eq('id', patient.id);

      await loadProfile();
      setSuccess('Citizenship document uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload citizenship document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!patient?.id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Check if profile is complete based on debug flags
      const hasRequiredFields = !!(form.phone && form.address);
      const hasProfilePicture = !!profile?.profile_picture_url;
      const hasDocuments = !!patient.citizenship_document_url;

      const profileComplete = checkProfileComplete({
        hasProfilePicture,
        hasRequiredFields,
        hasDocuments,
      });

      debugLog('Saving patient profile', {
        hasRequiredFields,
        hasProfilePicture,
        hasDocuments,
        profileComplete,
      });

      const { error: updateError } = await supabase
        .from('patient_profiles')
        .update({
          phone: form.phone,
          date_of_birth: form.date_of_birth || null,
          address: form.address,
          profile_completed: profileComplete,
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      await loadProfile();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const hasRequiredFieldsCheck = !!(form.phone && form.address);
  const hasProfilePictureCheck = !!profile?.profile_picture_url;
  const hasDocumentsCheck = !!patient?.citizenship_document_url;

  const isProfileComplete = checkProfileComplete({
    hasProfilePicture: hasProfilePictureCheck,
    hasRequiredFields: hasRequiredFieldsCheck,
    hasDocuments: hasDocumentsCheck,
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Complete your profile to book appointments</p>
      </div>

      {/* Debug Mode Indicator */}
      {(!DEBUG_CONFIG.REQUIRE_DOCUMENTS || !DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bug className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900">Debug Mode Active</h3>
              <p className="text-sm text-purple-800 mt-1">
                Some requirements are disabled for testing:
              </p>
              <ul className="text-sm text-purple-800 mt-2 space-y-1 list-disc list-inside">
                {!DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE && <li>Profile picture NOT required</li>}
                {!DEBUG_CONFIG.REQUIRE_DOCUMENTS && <li>Documents NOT required</li>}
              </ul>
              <p className="text-xs text-purple-700 mt-2">
                Edit <code className="bg-purple-100 px-1 rounded">src/config/debug.ts</code> to change these settings
              </p>
            </div>
          </div>
        </div>
      )}

      {!isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Complete Your Profile</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Please complete all required fields to start booking appointments.
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                {DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE && !hasProfilePictureCheck && <li>Upload profile picture</li>}
                {DEBUG_CONFIG.REQUIRE_DOCUMENTS && !hasDocumentsCheck && <li>Upload citizenship document</li>}
                {!form.phone && <li>Enter phone number</li>}
                {!form.address && <li>Enter address</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {patient?.profile_completed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Profile Complete</h3>
              <p className="text-sm text-green-800">Your profile is complete and you can book appointments.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Picture *
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleProfilePictureUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </div>
            </label>
            <p className="text-sm text-gray-600 mt-2">
              JPG, PNG. Max 5MB. Required for profile completion.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter your phone number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address *
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter your full address"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Required Documents
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Citizenship Document *
            </label>
            {patient?.citizenship_document_url ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Document Uploaded</p>
                  <a
                    href={patient.citizenship_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 hover:underline"
                  >
                    View Document
                  </a>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleCitizenshipUpload}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  <span className="text-sm text-green-700 hover:underline">
                    Replace
                  </span>
                </label>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleCitizenshipUpload}
                  className="hidden"
                  disabled={uploadingDoc}
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    {uploadingDoc ? 'Uploading...' : 'Upload Citizenship Document'}
                  </span>
                </div>
              </label>
            )}
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, or PDF. Max 10MB. Required for profile completion.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !form.phone || !form.address}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
