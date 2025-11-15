import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Calendar, User, Mail, Phone, MapPin, Download, Loader2, AlertCircle } from 'lucide-react';

interface PatientPublicData {
  profile: {
    full_name: string;
    email: string;
    profile_picture_url: string | null;
  };
  patientProfile: {
    phone: string;
    address: string;
    date_of_birth: string | null;
  };
  consultations: Array<{
    id: string;
    symptoms: string | null;
    medicines: string | null;
    additional_advice: string | null;
    follow_up: boolean;
    follow_up_date: string | null;
    created_at: string;
    appointments: {
      id: string;
      confirmed_date: string | null;
      doctor_profiles: {
        profiles: {
          full_name: string;
          email: string;
        };
        medical_categories: {
          name: string;
        };
      };
    };
  }>;
  documents: Array<{
    id: string;
    document_name: string;
    document_type: string;
    file_url: string;
    uploaded_at: string;
  }>;
  consultationSummaries: Array<{
    id: string;
    pdf_url: string;
    generated_at: string;
    appointments: {
      id: string;
      confirmed_date: string | null;
      doctor_profiles: {
        profiles: {
          full_name: string;
        };
        medical_categories: {
          name: string;
        };
      };
    };
  }>;
}

export default function PatientPublicView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PatientPublicData | null>(null);

  useEffect(() => {
    // Extract share token from URL path
    const path = window.location.pathname;
    const match = path.match(/^\/patient\/([a-f0-9-]+)$/i);
    const shareToken = match ? match[1] : null;
    
    if (shareToken) {
      fetchPatientData(shareToken);
    } else {
      setError('Invalid share link');
      setLoading(false);
    }
  }, []);

  const fetchPatientData = async (token: string) => {
    try {
      // Find patient by share_token
      const { data: patientProfile, error: patientError } = await supabase
        .from('patient_profiles')
        .select(`
          *,
          profiles (*)
        `)
        .eq('share_token', token)
        .maybeSingle();

      if (patientError || !patientProfile) {
        setError('Patient record not found or link is invalid');
        setLoading(false);
        return;
      }

      // Fetch consultations
      const { data: consultations } = await supabase
        .from('consultations')
        .select(`
          *,
          appointments (
            id,
            confirmed_date,
            doctor_profiles (
              profiles (full_name, email),
              medical_categories (name)
            )
          )
        `)
        .eq('patient_id', patientProfile.id)
        .order('created_at', { ascending: false });

      // Fetch documents
      const { data: documents } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientProfile.id)
        .order('uploaded_at', { ascending: false });

      // Fetch consultation summaries
      const { data: consultationSummaries } = await supabase
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

      setData({
        profile: patientProfile.profiles as any,
        patientProfile: patientProfile as any,
        consultations: (consultations || []) as any,
        documents: (documents || []) as any,
        consultationSummaries: (consultationSummaries || []) as any,
      });
    } catch (err: any) {
      console.error('Error fetching patient data:', err);
      setError(err.message || 'Failed to load patient data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error || 'Patient record not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {data.profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.profile.full_name}</h1>
              <p className="text-gray-600">Medical Records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Patient Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            Patient Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{data.profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{data.patientProfile.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{data.patientProfile.address || 'Not provided'}</p>
              </div>
            </div>
            {data.patientProfile.date_of_birth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.patientProfile.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consultation Summaries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Consultation Summaries
          </h2>
          {data.consultationSummaries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No consultation summaries available</p>
          ) : (
            <div className="space-y-3">
              {data.consultationSummaries.map((summary) => {
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
                        <p className="text-xs text-gray-500 mt-1">{date}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(summary.pdf_url, `consultation_${summary.appointments?.id}.pdf`)}
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

        {/* Consultations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Consultation History
          </h2>
          {data.consultations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No consultations available</p>
          ) : (
            <div className="space-y-4">
              {data.consultations.map((consultation) => {
                const appointment = consultation.appointments;
                const doctorName = appointment?.doctor_profiles?.profiles?.full_name || 'Unknown Doctor';
                const category = appointment?.doctor_profiles?.medical_categories?.name || '';
                const date = appointment?.confirmed_date
                  ? new Date(appointment.confirmed_date).toLocaleDateString()
                  : new Date(consultation.created_at).toLocaleDateString();

                return (
                  <div key={consultation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Dr. {doctorName}</h3>
                        <p className="text-sm text-gray-600">{category}</p>
                        <p className="text-xs text-gray-500 mt-1">{date}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {consultation.symptoms && (
                        <div>
                          <p className="font-medium text-gray-700">Symptoms:</p>
                          <p className="text-gray-600">{consultation.symptoms}</p>
                        </div>
                      )}
                      {consultation.medicines && (
                        <div>
                          <p className="font-medium text-gray-700">Medicines:</p>
                          <p className="text-gray-600">{consultation.medicines}</p>
                        </div>
                      )}
                      {consultation.additional_advice && (
                        <div>
                          <p className="font-medium text-gray-700">Advice:</p>
                          <p className="text-gray-600">{consultation.additional_advice}</p>
                        </div>
                      )}
                      {consultation.follow_up && consultation.follow_up_date && (
                        <div className="mt-2 p-2 bg-purple-50 rounded">
                          <p className="font-medium text-purple-700">Follow-up scheduled:</p>
                          <p className="text-purple-600">
                            {new Date(consultation.follow_up_date).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Documents
          </h2>
          {data.documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents available</p>
          ) : (
            <div className="space-y-3">
              {data.documents.map((doc) => (
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
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc.file_url, doc.document_name)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

