import { ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely 
                used to make websites work more efficiently and provide information to the website owners. Cookies allow a website to 
                recognize your device and store some information about your preferences or past actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                MeroClinic uses cookies and similar tracking technologies to track activity on our Service and hold certain information. 
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for the Service to function properly (e.g., authentication, security)</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our Service (e.g., analytics)</li>
                <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Targeting Cookies:</strong> Used to deliver relevant advertisements (if applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Strictly Necessary Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are essential for you to browse the website and use its features. Without these cookies, services you have 
                asked for cannot be provided. We use these cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Maintain your login session</li>
                <li>Remember your authentication state</li>
                <li>Ensure security and prevent fraud</li>
                <li>Load balance and maintain system performance</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Performance and Analytics Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies collect information about how you use our website, such as which pages you visit most often. This data helps 
                us improve the way the website works. We use these cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Understand how visitors interact with our Service</li>
                <li>Identify errors and areas for improvement</li>
                <li>Measure the effectiveness of our features</li>
                <li>Analyze traffic patterns and user behavior</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Functionality Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies allow the website to remember choices you make (such as your username, language, or region) and provide 
                enhanced, personalized features. We use these cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Remember information you've entered in forms</li>
                <li>Provide personalized content and features</li>
                <li>Remember your language and region preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, 
                deliver advertisements, and so on. These third parties may include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Analytics Providers:</strong> To help us understand how our Service is used</li>
                <li><strong>Payment Processors:</strong> To securely process payments</li>
                <li><strong>Cloud Service Providers:</strong> To store and manage data</li>
                <li><strong>Security Services:</strong> To protect against fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookie Duration</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Cookies can be either "persistent" or "session" cookies:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser. These are used to maintain 
                your session while you navigate through the website.</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until you delete them. These help us 
                remember your preferences and improve your experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Managing Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your 
                preferences in your browser settings. Most web browsers allow some control of most cookies through the browser settings.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                However, please note that if you choose to disable cookies, some features of our Service may not function properly. 
                Essential cookies cannot be disabled as they are necessary for the Service to function.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>How to manage cookies in popular browsers:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Do Not Track Signals</h2>
              <p className="text-gray-700 leading-relaxed">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to have your 
                online activity tracked. Currently, there is no standard for how DNT signals should be interpreted. As a result, our Service 
                does not currently respond to DNT browser signals or mechanisms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Cookie Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data use practices. 
                We will notify you of any material changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email:</strong> privacy@meroclinic.com<br />
                <strong>Subject:</strong> Cookie Policy Inquiry
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

