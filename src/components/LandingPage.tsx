import { useState, useEffect } from 'react';
import { Activity, Users, Calendar, Shield, CheckCircle, Star, ArrowRight, Zap, Heart, FileText, Video } from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Animate stats
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setStats({
        patients: Math.floor((50 * step) / steps),
        doctors: Math.floor((20 * step) / steps),
        appointments: Math.floor((30 * step) / steps),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleGetStarted = () => {
    // Open auth page in new tab
    window.open('/?auth=true', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Floating Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-lg shadow-lg py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400 blur-xl opacity-50 animate-pulse"></div>
              <img src="/asset/logo.png" alt="MeroClinic" className="w-10 h-10 rounded-lg shadow-lg relative" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              MeroClinic
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">How It Works</a>
            <a href="#stats" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">Stats</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors">Testimonials</a>
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div 
              className="space-y-8"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium animate-bounce">
                <Zap className="w-4 h-4" />
                <span>Nepal's #1 Healthcare Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Modern Healthcare,
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent"> Simplified</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Book appointments with verified doctors, manage consultations, and access your medical records — all in one secure platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-teal-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#how-it-works"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:border-teal-600 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                >
                  See How It Works
                </a>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">{stats.patients.toLocaleString()}+</div>
                  <div className="text-sm text-gray-600">Happy Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.doctors}+</div>
                  <div className="text-sm text-gray-600">Verified Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.appointments.toLocaleString()}+</div>
                  <div className="text-sm text-gray-600">Appointments</div>
                </div>
              </div>
            </div>

            {/* Right: Animated Card */}
            <div 
              className="relative"
              style={{
                transform: `translateY(${scrollY * -0.15}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              {/* Floating Background Elements */}
              <div 
                className="absolute top-0 right-0 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
                style={{
                  transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.08}px)`,
                }}
              ></div>
              <div 
                className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
                style={{
                  transform: `translate(${scrollY * -0.05}px, ${scrollY * -0.08}px)`,
                }}
              ></div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-400 blur-2xl opacity-50 animate-pulse"></div>
                    <img src="/asset/logo.png" alt="MeroClinic" className="w-32 h-32 rounded-2xl shadow-xl relative" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-center mb-2">Welcome to MeroClinic</h3>
                <p className="text-gray-600 text-center mb-6">Sign in to access your healthcare dashboard</p>

                <button
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                >
                  Sign In / Sign Up
                </button>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-teal-50 p-4 rounded-xl text-center">
                    <CheckCircle className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">For Patients</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-900">For Doctors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div 
            className="text-center mb-16"
            style={{
              transform: `translateY(${Math.max(0, scrollY - 400) * 0.05}px)`,
              opacity: Math.min(1, 1 - (Math.max(0, scrollY - 400) * 0.001)),
              transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">Powerful features for modern healthcare management</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600">Find and book appointments with verified doctors in seconds. Real-time availability updates.</p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Records</h3>
              <p className="text-gray-600">Your medical records are encrypted and secure. Download reports as PDF anytime.</p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">Get help whenever you need it. Our support team is always ready to assist you.</p>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Doctors</h3>
              <p className="text-gray-600">All doctors are verified and licensed. View ratings, reviews, and specializations.</p>
            </div>

            <div className="group bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Reports</h3>
              <p className="text-gray-600">Access all your medical reports digitally. Share with doctors instantly.</p>
            </div>

            <div className="group relative bg-gradient-to-br from-indigo-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-dashed border-indigo-200">
              <div className="absolute top-4 right-4">
                <span className="bg-indigo-500 text-white text-xs px-3 py-1 rounded-full font-semibold">Coming Soon</span>
              </div>
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform opacity-50">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Video Consultations</h3>
              <p className="text-gray-600">Connect with doctors via secure video calls from anywhere in Nepal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Flow Chart */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200 -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className={`bg-white p-8 rounded-2xl shadow-xl transition-all duration-500 ${
                activeStep === 0 ? 'scale-105 shadow-2xl' : ''
              }`}>
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                  1
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Sign Up</h3>
                <p className="text-gray-600 text-center">Create your account in seconds. Choose whether you're a patient or doctor.</p>
              </div>

              {/* Step 2 */}
              <div className={`bg-white p-8 rounded-2xl shadow-xl transition-all duration-500 ${
                activeStep === 1 ? 'scale-105 shadow-2xl' : ''
              }`}>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                  2
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Find & Book</h3>
                <p className="text-gray-600 text-center">Search for doctors by specialty and location. Book appointments instantly.</p>
              </div>

              {/* Step 3 */}
              <div className={`bg-white p-8 rounded-2xl shadow-xl transition-all duration-500 ${
                activeStep === 2 ? 'scale-105 shadow-2xl' : ''
              }`}>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                  3
                </div>
                <h3 className="text-xl font-bold text-center mb-3">Get Care</h3>
                <p className="text-gray-600 text-center">Attend your appointment and access your medical records anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl font-bold">{stats.patients.toLocaleString()}+</div>
              <div className="text-teal-100 text-lg">Happy Patients</div>
              <div className="text-teal-200 text-sm">Trusted by many</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">{stats.doctors}+</div>
              <div className="text-blue-100 text-lg">Verified Doctors</div>
              <div className="text-blue-200 text-sm">Across all specialties</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">{stats.appointments.toLocaleString()}+</div>
              <div className="text-purple-100 text-lg">Appointments</div>
              <div className="text-purple-200 text-sm">Successfully completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold">4.9</div>
              <div className="text-yellow-100 text-lg flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                Average Rating
              </div>
              <div className="text-yellow-200 text-sm">From 20+ reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">Trusted by thousands across Nepal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-teal-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"MeroClinic ले मेरो डाक्टर भेट्ने प्रक्रिया सजिलो बनायो। अब म घरबाटै appointment book गर्न सक्छु।"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                  SK
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Suman Karki</div>
                  <div className="text-sm text-gray-600">Patient</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"डाक्टरहरूसँग भेटघाट र रिपोर्टहरू एक ठाउँमा राख्न मिल्यो। धेरै सुविधाजनक छ।"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  MS
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maya Shrestha</div>
                  <div className="text-sm text-gray-600">Patient</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"Follow-up सुविधा धेरै उपयोगी छ। मेरा सबै patients को records राम्रोसँग manage गर्न सक्छु।"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  RT
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Dr. Rajendra Thapa</div>
                  <div className="text-sm text-gray-600">Cardiologist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-teal-100">Join thousands of patients and doctors using MeroClinic today</p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-teal-600 px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
          >
            Sign Up Now - It's Free!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/asset/logo.png" alt="MeroClinic" className="w-10 h-10 rounded-lg" />
                <span className="text-xl font-bold">MeroClinic</span>
              </div>
              <p className="text-gray-400 text-sm">Your Health, Our Priority. Modern healthcare management for Nepal.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#features" className="hover:text-teal-400 transition-colors">Features</a></div>
                <div><a href="#how-it-works" className="hover:text-teal-400 transition-colors">How It Works</a></div>
                <div><a href="#testimonials" className="hover:text-teal-400 transition-colors">Testimonials</a></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">For Users</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div><a href="#" className="hover:text-teal-400 transition-colors">Patients</a></div>
                <div><a href="#" className="hover:text-teal-400 transition-colors">Doctors</a></div>
                <div><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Phone: <a href="tel:+919820987206" className="text-teal-400 hover:text-teal-300">9820987206</a></div>
                <div>Email: <a href="mailto:blackbytesnp@gmail.com" className="text-teal-400 hover:text-teal-300">blackbytesnp@gmail.com</a></div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>© 2025 MeroClinic. All rights reserved to BlackBytes.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
