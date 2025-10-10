import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, DoctorProfile, MedicalCategory } from '../../lib/supabase';
import { uploadProfilePicture, uploadDocument } from '../../lib/storage';
import { User, Phone, MapPin, Upload, FileText, Camera, CheckCircle, AlertCircle, Award, GraduationCap, Bug } from 'lucide-react';
import { DEBUG_CONFIG, isProfileComplete as checkProfileComplete, debugLog } from '../../config/debug';

export default function DoctorProfileEdit() {
  const { profile, refreshProfile } = useAuth();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [categories, setCategories] = useState<MedicalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [form, setForm] = useState({
    category_id: '',
    qualifications: '',
    experience_years: 0,
    bio: '',
    consultation_fee: 0,
    contact_phone: '',
    contact_email: '',
    location: '',
    nmc_number: '',
    has_md: false,
  });

  useEffect(() => {
    loadProfile();
    loadCategories();
  }, [profile?.id]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('medical_categories')
        .select('*')
        .order('name');
      
      if (data) setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadProfile = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (data) {
        setDoctor(data);
        setForm({
          category_id: data.category_id || '',
          qualifications: data.qualifications || '',
          experience_years: data.experience_years || 0,
          bio: data.bio || '',
          consultation_fee: data.consultation_fee || 0,
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          location: data.location || '',
          nmc_number: data.nmc_number || '',
          has_md: data.has_md || false,
        });
      }
    } catch (err) {
      console.error('Failed to load doctor profile', err);
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

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: 'citizenship' | 'mbbs' | 'md'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id || !doctor?.id) return;

    setUploadingDoc(documentType);
    setError('');

    try {
      const { url } = await uploadDocument(file, profile.id, documentType);

      const fieldMap = {
        citizenship: 'citizenship_document_url',
        mbbs: 'mbbs_certificate_url',
        md: 'md_certificate_url',
      };

      await supabase
        .from('doctor_profiles')
        .update({ [fieldMap[documentType]]: url })
        .eq('id', doctor.id);

      await loadProfile();
      setSuccess(`${documentType.toUpperCase()} certificate uploaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSave = async () => {
    if (!doctor?.id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Check if profile is complete based on debug flags
      const hasRequiredFields = !!(
        form.category_id &&
        form.qualifications &&
        form.contact_phone &&
        form.location
      );

      const hasProfilePicture = !!profile?.profile_picture_url;
      const hasDocuments = !!(
        doctor.citizenship_document_url &&
        doctor.mbbs_certificate_url &&
        (!form.has_md || doctor.md_certificate_url)
      );
      const hasNmcNumber = !!form.nmc_number;

      const profileComplete = checkProfileComplete({
        hasProfilePicture,
        hasRequiredFields,
        hasDocuments,
        hasNmcNumber,
      });

      debugLog('Saving doctor profile', {
        hasRequiredFields,
        hasProfilePicture,
        hasDocuments,
        hasNmcNumber,
        profileComplete,
      });

      const { error: updateError } = await supabase
        .from('doctor_profiles')
        .update({
          category_id: form.category_id,
          qualifications: form.qualifications,
          experience_years: form.experience_years,
          bio: form.bio,
          consultation_fee: form.consultation_fee,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          location: form.location,
          nmc_number: form.nmc_number,
          has_md: form.has_md,
          profile_completed: profileComplete,
        })
        .eq('id', doctor.id);

      if (updateError) throw updateError;

      await loadProfile();
      
      if (profileComplete && !doctor.profile_completed) {
        if (DEBUG_CONFIG.ENABLE_DOCTOR_VERIFICATION) {
          setSuccess('Profile completed! Your profile will be verified within 24 hours.');
        } else {
          setSuccess('Profile completed! (Verification disabled in debug mode)');
        }
      } else {
        setSuccess('Profile updated successfully!');
      }
      
      setTimeout(() => setSuccess(''), 5000);
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

  const hasRequiredFieldsCheck = !!(
    form.category_id &&
    form.qualifications &&
    form.contact_phone &&
    form.location
  );

  const hasProfilePictureCheck = !!profile?.profile_picture_url;
  const hasDocumentsCheck = !!(
    doctor?.citizenship_document_url &&
    doctor?.mbbs_certificate_url &&
    (!form.has_md || doctor?.md_certificate_url)
  );
  const hasNmcNumberCheck = !!form.nmc_number;

  const isProfileComplete = checkProfileComplete({
    hasProfilePicture: hasProfilePictureCheck,
    hasRequiredFields: hasRequiredFieldsCheck,
    hasDocuments: hasDocumentsCheck,
    hasNmcNumber: hasNmcNumberCheck,
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Complete your profile to receive appointment requests</p>
      </div>

      {/* Debug Mode Indicator */}
      {(!DEBUG_CONFIG.REQUIRE_DOCUMENTS || !DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE || !DEBUG_CONFIG.ENABLE_DOCTOR_VERIFICATION || !DEBUG_CONFIG.REQUIRE_NMC_NUMBER) && (
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
                {!DEBUG_CONFIG.REQUIRE_NMC_NUMBER && <li>NMC number NOT required</li>}
                {!DEBUG_CONFIG.ENABLE_DOCTOR_VERIFICATION && <li>Verification workflow DISABLED</li>}
              </ul>
              <p className="text-xs text-purple-700 mt-2">
                Edit <code className="bg-purple-100 px-1 rounded">src/config/debug.ts</code> to change these settings
              </p>
            </div>
          </div>
        </div>
      )}

      {!doctor?.profile_completed && !isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Complete Your Profile</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Please complete all required fields and upload all necessary documents to start receiving appointment requests.
              </p>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                {DEBUG_CONFIG.REQUIRE_PROFILE_PICTURE && !profile?.profile_picture_url && <li>Upload profile picture</li>}
                {DEBUG_CONFIG.REQUIRE_DOCUMENTS && !doctor?.citizenship_document_url && <li>Upload citizenship document</li>}
                {DEBUG_CONFIG.REQUIRE_DOCUMENTS && !doctor?.mbbs_certificate_url && <li>Upload MBBS certificate</li>}
                {DEBUG_CONFIG.REQUIRE_DOCUMENTS && form.has_md && !doctor?.md_certificate_url && <li>Upload MD certificate</li>}
                {DEBUG_CONFIG.REQUIRE_NMC_NUMBER && !form.nmc_number && <li>Enter NMC registration number</li>}
                {!form.contact_phone && <li>Enter contact phone</li>}
                {!form.location && <li>Enter practice location</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {DEBUG_CONFIG.ENABLE_DOCTOR_VERIFICATION && doctor?.profile_completed && !doctor?.is_verified && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Verification Pending</h3>
              <p className="text-sm text-blue-800">
                Your profile has been submitted for verification. Our team will verify your credentials within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {doctor?.is_verified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Profile Verified</h3>
              <p className="text-sm text-green-800">Your profile has been verified and is now visible to patients.</p>
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
                {profile?.full_name?.charAt(0) || 'D'}
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

      {/* Professional Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Professional Information
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
              Medical Specialty *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              NMC Registration Number *
            </label>
            <input
              type="text"
              value={form.nmc_number}
              onChange={(e) => setForm({ ...form, nmc_number: e.target.value })}
              placeholder="Enter your NMC number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for verification by our team
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualifications *
            </label>
            <input
              type="text"
              value={form.qualifications}
              onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
              placeholder="e.g., MBBS, MD"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="has_md"
              checked={form.has_md}
              onChange={(e) => setForm({ ...form, has_md: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="has_md" className="text-sm font-medium text-gray-700">
              I have an MD degree
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Brief description about yourself and your practice"
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consultation Fee (USD)
            </label>
            <input
              type="number"
              value={form.consultation_fee}
              onChange={(e) => setForm({ ...form, consultation_fee: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Phone *
            </label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="Enter your contact number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="Enter your contact email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Practice Location *
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Kathmandu Medical Center, Kathmandu"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
          {/* Citizenship */}
          <DocumentUploadField
            label="Citizenship Document *"
            documentUrl={doctor?.citizenship_document_url}
            uploading={uploadingDoc === 'citizenship'}
            onUpload={(e) => handleDocumentUpload(e, 'citizenship')}
          />

          {/* MBBS Certificate */}
          <DocumentUploadField
            label="MBBS Certificate *"
            documentUrl={doctor?.mbbs_certificate_url}
            uploading={uploadingDoc === 'mbbs'}
            onUpload={(e) => handleDocumentUpload(e, 'mbbs')}
          />

          {/* MD Certificate (conditional) */}
          {form.has_md && (
            <DocumentUploadField
              label="MD Certificate *"
              documentUrl={doctor?.md_certificate_url}
              uploading={uploadingDoc === 'md'}
              onUpload={(e) => handleDocumentUpload(e, 'md')}
            />
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// Helper component for document upload fields
function DocumentUploadField({
  label,
  documentUrl,
  uploading,
  onUpload,
}: {
  label: string;
  documentUrl: string | null | undefined;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {documentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Document Uploaded</p>
            <a
              href={documentUrl}
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
              onChange={onUpload}
              className="hidden"
              disabled={uploading}
            />
            <span className="text-sm text-green-700 hover:underline">Replace</span>
          </label>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors">
            <Upload className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : `Upload ${label.replace(' *', '')}`}
            </span>
          </div>
        </label>
      )}
      <p className="text-xs text-gray-500 mt-2">
        JPG, PNG, or PDF. Max 10MB. Required for profile completion.
      </p>
    </div>
  );
}
