export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Agent Croww ("Platform", "we", "us", "our") is operated by Rookus and is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                We comply with the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian data protection laws. By using our Platform, you consent to the practices described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, password (encrypted)</li>
                <li><strong>Business Information:</strong> For vendors - business name, GST registration number; For sellers - PAN number</li>
                <li><strong>Payment Information:</strong> Bank account details for payouts (UPI, account number, IFSC)</li>
                <li><strong>Transaction Data:</strong> Purchase history, sales records, commission earnings</li>
                <li><strong>Communication:</strong> Messages, support tickets, feedback you send us</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <p className="text-gray-600 leading-relaxed">
                When you use our Platform, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Device information (type, browser, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Pages visited, time spent, click patterns</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">
                We use your information only for lawful purposes as permitted under the DPDP Act:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related confirmations</li>
                <li>Calculate and distribute commissions to vendors and sellers</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Communicate with you about products, orders, and updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Comply with legal obligations under Indian law</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing</h2>
              <p className="text-gray-600 leading-relaxed">
                Under the DPDP Act, we process your personal data based on:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Consent:</strong> For marketing communications and non-essential services</li>
                <li><strong>Contract Performance:</strong> To fulfill our obligations under user agreements</li>
                <li><strong>Legal Obligation:</strong> To comply with GST laws, tax regulations, and court orders</li>
                <li><strong>Legitimate Interest:</strong> For fraud prevention and platform security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Transaction Parties:</strong> Sellers with vendors (for order fulfillment), customers with sellers</li>
                <li><strong>Payment Processors:</strong> Banks, payment gateways for processing transactions</li>
                <li><strong>Service Providers:</strong> Cloud hosting, email services, analytics (under data protection agreements)</li>
                <li><strong>Government Authorities:</strong> As required by Indian law, court orders, or tax authorities</li>
                <li><strong>Legal Requirements:</strong> To protect rights, safety, or investigate fraud</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement robust security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Encryption of passwords using bcrypt hashing algorithm</li>
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure cloud infrastructure with access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Limited employee access on a need-to-know basis</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                However, no method of transmission over the Internet is 100% secure. We strive for reasonable security appropriate to the sensitivity of the data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your information only as long as necessary:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Account Data:</strong> While your account is active + 7 years for tax compliance</li>
                <li><strong>Transaction Records:</strong> 7 years as per Indian tax laws</li>
                <li><strong>GST Records:</strong> 6 years from end of financial year</li>
                <li><strong>Support Communications:</strong> 2 years after resolution</li>
                <li><strong>Marketing Data:</strong> Until you withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights Under DPDP Act</h2>
              <p className="text-gray-600 leading-relaxed">
                As a Data Principal, you have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Access:</strong> Request a copy of your personal data we hold</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your data when no longer necessary</li>
                <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Withdraw Consent:</strong> Withdraw previously given consent for processing</li>
                <li><strong>Grievance Redressal:</strong> File complaints about data processing</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                To exercise these rights, contact us at team@agentcroww.com. We will respond within 10 business days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Keep you signed in and remember preferences</li>
                <li>Understand how you use our Platform</li>
                <li>Personalize your experience</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                You can manage cookie preferences through your browser settings. Disabling cookies may affect some Platform features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Platform is not intended for users under 18 years of age. We do not knowingly collect information from children. If we become aware that a child has provided us with personal information, we will take steps to delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Cross-Border Transfer</h2>
              <p className="text-gray-600 leading-relaxed">
                Your data is primarily stored on servers located in India. If we need to transfer data outside India for legitimate business purposes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Notify you of the transfer and destination country</li>
                <li>Ensure adequate protection through standard contractual clauses</li>
                <li>Comply with DPDP Act requirements for cross-border transfer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Third-Party Links</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to read their privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy periodically. Significant changes will be notified via email or Platform announcement. Continued use after changes constitutes acceptance. The effective date will be updated at the top of this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                For privacy-related inquiries or to exercise your rights, contact our Data Protection Officer:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Data Protection Officer:</strong> Agent Croww Support Team</p>
                <p className="text-gray-700"><strong>Email:</strong> team@agentcroww.com</p>
                <p className="text-gray-700"><strong>Response Time:</strong> Within 10 business days</p>
                <p className="text-gray-700"><strong>Operated by:</strong> Rookus</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
