import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Notification } from '../lib/supabase';
import { Bell, User, LogOut, Settings, Calendar, Home, Users, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string, payload?: { openAppointmentId?: string }) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) {
      fetchNotifications();

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    fetchNotifications();
  };

  const getNavItems = () => {
    if (!profile) return [];

    const commonItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
    ];

    if (profile.role === 'patient') {
      return [
        ...commonItems,
        { id: 'doctors', label: 'Find Doctors', icon: Users },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }

    if (profile.role === 'doctor') {
      return [
        ...commonItems,
        { id: 'profile', label: 'My Profile', icon: User },
      ];
    }

    if (profile.role === 'admin') {
      return [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'doctors', label: 'Manage Doctors', icon: Users },
        { id: 'users', label: 'All Users', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    return commonItems;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md animate-float">
                <img src="/asset/logo.png" alt="MeroClinic" className="w-10 h-10 object-cover block" />
              </div>
              <span className="text-xl font-bold text-gray-900 ml-3 animate-fade-in">MeroClinic</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
                {getNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors transform hover:-translate-y-0.5 hover:scale-[1.01] flex items-center gap-2 ${
                      currentView === item.id
                        ? 'bg-teal-50 text-teal-600 shadow-inner'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-teal-600 hover:text-teal-700"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer ${
                              !notif.is_read ? 'bg-teal-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-sm text-gray-900">{notif.title}</h4>
                              {!notif.is_read && (
                                <span className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-gray-300 mx-2"></div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
            {/* Mobile nav placeholder - replaced by slide-down panel */}
            <div className="text-sm text-gray-500">Menu</div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${
                    currentView === item.id ? 'bg-teal-50 text-teal-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
