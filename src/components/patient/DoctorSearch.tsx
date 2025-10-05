import { useEffect, useState } from 'react';
import { supabase, DoctorProfile, MedicalCategory } from '../../lib/supabase';
import { Search, MapPin, DollarSign, Award, Star } from 'lucide-react';

interface DoctorSearchProps {
  onSelectDoctor: (doctor: DoctorProfile) => void;
}

export default function DoctorSearch({ onSelectDoctor }: DoctorSearchProps) {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [categories, setCategories] = useState<MedicalCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchDoctors();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('medical_categories')
      .select('*')
      .order('name');

    if (data) setCategories(data);
  };

  const fetchDoctors = async () => {
    setLoading(true);
    let query = supabase
      .from('doctor_profiles')
      .select(`
        *,
        profiles!doctor_profiles_user_id_fkey(id, full_name, email, avatar_url),
        medical_categories(id, name, icon)
      `)
      .eq('is_verified', true)
      .eq('is_visible', true)
      .order('rank_score', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data } = await query;

    if (data) {
      setDoctors(data as any);
    }
    setLoading(false);
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const profile = doctor.profiles as any;
    const category = doctor.medical_categories as any;
    const searchLower = searchTerm.toLowerCase();

    return (
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      doctor.qualifications?.toLowerCase().includes(searchLower) ||
      category?.name?.toLowerCase().includes(searchLower) ||
      doctor.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Doctor</h1>
        <p className="text-gray-600">Search and connect with verified healthcare professionals</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">All Specialties</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Loading doctors...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600">No doctors found matching your criteria</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => {
            const profile = doctor.profiles as any;
            const category = doctor.medical_categories as any;

            return (
              <div
                key={doctor.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {profile?.full_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        Dr. {profile?.full_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-teal-600 font-medium">{category?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{doctor.qualifications}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4 flex-shrink-0" />
                      <span>{doctor.experience_years} years experience</span>
                    </div>
                    {doctor.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{doctor.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 flex-shrink-0" />
                      <span>${doctor.consultation_fee} consultation fee</span>
                    </div>
                  </div>

                  {doctor.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doctor.bio}</p>
                  )}

                  <button
                    onClick={() => onSelectDoctor(doctor)}
                    className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
