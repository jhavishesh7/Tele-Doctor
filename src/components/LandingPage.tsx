
import { MouseEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onShowAuth?: () => void;
}

export default function LandingPage({ onShowAuth }: LandingPageProps) {
  const { signInWithProvider } = useAuth() as any;

  const handleGetStarted = (e: MouseEvent) => {
    e.preventDefault();
    if (onShowAuth) return onShowAuth();
    if (signInWithProvider) signInWithProvider('google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
      <header className="py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/asset/logo.png" alt="MeroClinic" className="w-10 h-10 rounded-md shadow-sm" />
            <span className="text-lg font-semibold">MeroClinic</span>
          </div>
          <div>
            <a href="#features" className="text-sm text-gray-600 hover:text-teal-600 transition-colors mr-4">Features</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-teal-600 transition-colors mr-4">Testimonials</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Contact</a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Hero content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight animate-fade-in">Modern care, close to you</h1>
            <p className="text-gray-600 text-lg">Book appointments, manage consultations, and download secure reports — all in one simple app for patients and doctors.</p>

            <div className="flex items-center gap-4">
              <button onClick={handleGetStarted} className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg shadow hover:bg-teal-700 transition-transform transform hover:-translate-y-0.5">Get Started</button>
              <a href="#features" className="text-sm text-gray-600 hover:text-teal-600">Learn more</a>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm w-full animate-fade-in hover:scale-[1.02] transition-transform">
                <div className="text-sm font-medium text-gray-900">Easy Booking</div>
                <div className="text-xs text-gray-500">Find doctors & schedule visits</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm w-full animate-fade-in hover:scale-[1.02] transition-transform">
                <div className="text-sm font-medium text-gray-900">Secure Records</div>
                <div className="text-xs text-gray-500">Download reports as PDF</div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm w-full animate-fade-in hover:scale-[1.02] transition-transform border-dashed border-2 border-teal-50">
                <div className="text-sm font-medium text-teal-700">Online Consultation</div>
                <div className="text-xs text-gray-500">Coming soon! Book tele-consultations and video visits</div>
              </div>
            </div>
          </div>

          {/* Right: Sign-in panel */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg animate-fade-in">
              {/* Logo hero with floating effect */}
              <div className="flex items-center justify-center">
                <div className="p-6 bg-gradient-to-br from-white to-teal-50 rounded-2xl shadow-lg animate-float">
                  <img src="/asset/logo.png" alt="MeroClinic logo" className="w-40 h-40 object-contain block" />
                </div>
              </div>

              <h3 className="text-xl font-semibold mt-4">Sign in to your account</h3>
              <p className="text-sm text-gray-600 mb-4">Patients and doctors can sign in to access schedules, appointments, and reports.</p>
              <div className="space-y-3">
                <button
                  onClick={() => (onShowAuth ? onShowAuth() : undefined)}
                  className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="bg-transparent py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm transform hover:-translate-y-1 transition">Realtime notifications and reminders</div>
            <div className="bg-white p-6 rounded-lg shadow-sm transform hover:-translate-y-1 transition">Doctor profiles & search</div>
            <div className="bg-white p-6 rounded-lg shadow-sm transform hover:-translate-y-1 transition">Secure PDF reports & follow-ups</div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-6">What our users say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <div className="text-sm text-gray-700">"MeroClinic ले मेरो डाक्टर भेट्ने प्रक्रिया सजिलो बनायो।"</div>
              <div className="mt-3 text-sm font-medium">— Suman Karki</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <div className="text-sm text-gray-700">"डाक्टरहरूसँग भेटघाट र रिपोर्टहरू एक ठाउँमा राख्न मिल्यो।"</div>
              <div className="mt-3 text-sm font-medium">— Maya Shrestha</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm animate-fade-in">
              <div className="text-sm text-gray-700">"Follow-up सुविधा धेरै उपयोगी छ।"</div>
              <div className="mt-3 text-sm font-medium">— Rajendra Thapa</div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <img src="/asset/logo.png" alt="MeroClinic" className="w-12 h-12 rounded-md mb-2" />
            <div className="text-sm text-gray-600">MeroClinic — Your Health, Our Priority</div>
          </div>

          <div className="text-sm text-gray-700">
            <div><strong>Contact</strong></div>
            <div>Phone: <a href="tel:+919820987206" className="text-teal-600">9820987206</a></div>
            <div>Email: <a href="mailto:blackbytesnp@gmail.com" className="text-teal-600">blackbytesnp@gmail.com</a></div>
          </div>

          <div className="text-sm text-gray-500">© All rights reserved to BlackBytes</div>
        </div>
      </footer>
    </div>
  );
}
