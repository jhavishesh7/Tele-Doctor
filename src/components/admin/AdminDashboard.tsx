import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Stethoscope, Calendar, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const [
      { count: totalUsers },
      { count: totalDoctors },
      { count: verifiedDoctors },
      { count: totalPatients },
      { count: totalAppointments },
      { count: completedAppointments },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('patient_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    ]);

    setStats({
      totalUsers: totalUsers || 0,
      totalDoctors: totalDoctors || 0,
      verifiedDoctors: verifiedDoctors || 0,
      pendingDoctors: (totalDoctors || 0) - (verifiedDoctors || 0),
      totalPatients: totalPatients || 0,
      totalAppointments: totalAppointments || 0,
      completedAppointments: completedAppointments || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Users</h3>
          <p className="text-sm text-gray-600">All registered users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Doctors</h3>
          <p className="text-sm text-gray-600">
            {stats.verifiedDoctors} verified, {stats.pendingDoctors} pending
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalPatients}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Patients</h3>
          <p className="text-sm text-gray-600">Registered patients</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalAppointments}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Appointments</h3>
          <p className="text-sm text-gray-600">
            {stats.completedAppointments} completed
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Doctors pending verification</span>
              <span className="font-semibold text-gray-900">{stats.pendingDoctors}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Verified doctors</span>
              <span className="font-semibold text-gray-900">{stats.verifiedDoctors}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Active appointments</span>
              <span className="font-semibold text-gray-900">
                {stats.totalAppointments - stats.completedAppointments}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Completion rate</span>
              <span className="font-semibold text-gray-900">
                {stats.totalAppointments > 0
                  ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Platform Management</h2>
          <p className="mb-6 text-teal-50">
            Manage doctors, verify profiles, and oversee all platform activities
          </p>
          <div className="space-y-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
              <span className="font-medium">Pending verifications</span>
              <span className="bg-white text-teal-600 px-3 py-1 rounded-full text-sm font-bold">
                {stats.pendingDoctors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
