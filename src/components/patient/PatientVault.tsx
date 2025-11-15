import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadFile, deleteFile, validateFile, StorageBucket } from '../../lib/storage';
import { Upload, FileText, X, Download, Share2, QrCode, File, Trash2, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PatientDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
}

interface ConsultationSummary {
  id: string;
  consultation_id: string;
  appointment_id: string;
  pdf_url: string;
  pdf_path: string;
  file_size: number | null;
  generated_at: string;
  appointments?: {
    id: string;
    confirmed_date: string | null;
    doctor_profiles?: {
      profiles?: {
        full_name: string;
      };
      medical_categories?: {
        name: string;
      };
    };
  };
}

export default function PatientVault() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [consultationSummaries, setConsultationSummaries] = useState<ConsultationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      fetchDocuments();
      fetchConsultationSummaries();
      fetchShareToken();
    }
  }, [profile]);

  const fetchShareToken = async () => {
    if (!profile) return;
    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('share_token')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (patientProfile?.share_token) {
        setShareToken(patientProfile.share_token);
      } else {
        // Generate new token if doesn't exist
        const { data: updated } = await supabase
          .from('patient_profiles')
          .update({ share_token: crypto.randomUUID() })
          .eq('user_id', profile.id)
          .select('share_token')
          .single();

        if (updated?.share_token) {
          setShareToken(updated.share_token);
        }
      }
    } catch (err) {
      console.error('Failed to fetch share token', err);
    }
  };

  const fetchDocuments = async () => {
    if (!profile) return;

    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!patientProfile) return;

      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientProfile.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      if (data) setDocuments(data as PatientDocument[]);
    } catch (err: any) {
      console.error('Failed to fetch documents', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultationSummaries = async () => {
    if (!profile) return;

    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!patientProfile) return;

      const { data, error } = await supabase
        .from('consultation_summaries')
        .select(`
          *,
          appointments (
            id,
            confirmed_date,
            doctor_profiles (
              profiles (full_name),
              medical_categories (name)
            )
          )
        `)
        .eq('patient_id', patientProfile.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      if (data) setConsultationSummaries(data as ConsultationSummary[]);
    } catch (err: any) {
      console.error('Failed to fetch consultation summaries', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    const validation = validateFile(file, 10, [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ]);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!patientProfile) throw new Error('Patient profile not found');

      // Determine document type from file name or let user specify
      const documentType = 'other'; // Default, can be enhanced with a dropdown
      const documentName = file.name;

      // Upload file to storage
      const uploadResult = await uploadFile(
        file,
        'Documents',
        `vault/${patientProfile.id}`
      );

      // Save document record to database
      const { error: insertError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientProfile.id,
          document_name: documentName,
          document_type: documentType,
          file_url: uploadResult.url,
          file_path: uploadResult.path,
          file_size: file.size,
        });

      if (insertError) throw insertError;

      // Refresh documents list
      await fetchDocuments();
    } catch (err: any) {
      console.error('Upload error', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (document: PatientDocument) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) return;

    try {
      // Delete from storage
      await deleteFile('Documents', document.file_path);

      // Delete from database
      const { error } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      // Refresh documents list
      await fetchDocuments();
    } catch (err: any) {
      console.error('Delete error', err);
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getShareUrl = () => {
    if (!shareToken) return '';
    return `${window.location.origin}/patient/${shareToken}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Vault</h1>
          <p className="text-gray-600">Manage your medical documents and consultation summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <label className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showQR && shareToken && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Share Your Medical Records</h2>
            <button
              onClick={() => setShowQR(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              <QRCodeSVG value={getShareUrl()} size={256} />
            </div>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Scan this QR code to view your complete medical records, including all consultations and reports.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg w-full max-w-md">
              <input
                type="text"
                value={getShareUrl()}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareUrl());
                  alert('Link copied to clipboard!');
                }}
                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Summaries Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Consultation Summaries
        </h2>
        {consultationSummaries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No consultation summaries yet. They will appear here after your appointments are completed.
          </p>
        ) : (
          <div className="space-y-3">
            {consultationSummaries.map((summary) => {
              const appointment = summary.appointments;
              const doctorName = appointment?.doctor_profiles?.profiles?.full_name || 'Unknown Doctor';
              const category = appointment?.doctor_profiles?.medical_categories?.name || '';
              const date = appointment?.confirmed_date
                ? new Date(appointment.confirmed_date).toLocaleDateString()
                : 'N/A';

              return (
                <div
                  key={summary.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Consultation with Dr. {doctorName}
                      </h3>
                      <p className="text-sm text-gray-600">{category}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {date} • {formatFileSize(summary.file_size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(summary.pdf_url, `consultation_${summary.appointment_id}.pdf`)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Uploaded Documents Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <File className="w-5 h-5 text-teal-600" />
          Your Documents
        </h2>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No documents uploaded yet</p>
            <p className="text-sm text-gray-400">Upload your medical documents to keep them safe and organized</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{doc.document_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{doc.document_type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(doc.uploaded_at).toLocaleDateString()} • {formatFileSize(doc.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(doc.file_url, doc.document_name)}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-gray-900">Uploading document...</span>
          </div>
        </div>
      )}
    </div>
  );
}

