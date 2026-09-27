export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Refund & Cancellation Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Overview</h2>
              <p className="text-gray-600 leading-relaxed">
                At Agent Croww, we strive to ensure customer satisfaction with every purchase. This Refund & Cancellation Policy outlines the terms and conditions for refunds on digital products purchased through our Platform, operated by Rookus.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                This policy complies with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Digital Product Nature</h2>
              <p className="text-gray-600 leading-relaxed">
                All products sold on Agent Croww are digital products including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Online courses and educational content</li>
                <li>E-books and digital publications</li>
                <li>Templates, graphics, and digital assets</li>
                <li>Software and digital tools</li>
                <li>Membership access and subscriptions</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Due to the intangible nature of digital products, our refund policy differs from physical goods.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Refund Eligibility</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">3.1 Full Refund Within 7 Days</h3>
              <p className="text-gray-600 leading-relaxed">
                You are eligible for a full refund if:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Request is made within 7 days of purchase</li>
                <li>You have accessed less than 30% of the course/content (for courses)</li>
                <li>The product has not been downloaded (for downloadable products)</li>
                <li>The product is materially different from its description</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">3.2 Technical Issues</h3>
              <p className="text-gray-600 leading-relaxed">
                Full refund if:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>The product is technically defective and cannot be resolved</li>
                <li>Platform fails to provide access despite successful payment</li>
                <li>Content is corrupted or inaccessible due to our technical failure</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">3.3 Partial Refund Conditions</h3>
              <p className="text-gray-600 leading-relaxed">
                Partial refunds (up to 50%) may be considered within 7-14 days if:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Course content is outdated or not as advertised</li>
                <li>Significant portions of content are missing</li>
                <li>Valid concerns about quality with supporting evidence</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Non-Refundable Situations</h2>
              <p className="text-gray-600 leading-relaxed">
                Refunds will NOT be granted for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Change of mind after 7 days from purchase</li>
                <li>Completed courses where more than 70% content was accessed</li>
                <li>Products that have been fully downloaded and used</li>
                <li>Compatibility issues clearly mentioned in product requirements</li>
                <li>Products purchased during promotional sales (unless defective)</li>
                <li>Failure to cancel subscription before renewal date</li>
                <li>Circumventing technological access controls</li>
                <li>Refund requests without valid order details</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cooling-Off Period</h2>
              <p className="text-gray-600 leading-relaxed">
                As per Consumer Protection (E-Commerce) Rules, 2020, we provide a cooling-off period:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700 font-medium">7-Day Cooling-Off Period</p>
                <p className="text-gray-600 mt-2">
                  Customers may request cancellation and full refund within 7 days of purchase for any reason, provided the digital product has not been substantially consumed (more than 30% access) or downloaded.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Refund Process</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">6.1 How to Request a Refund</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 mt-2">
                <li>Login to your Agent Croww account</li>
                <li>Go to "My Orders" section</li>
                <li>Select the order and click "Request Refund"</li>
                <li>Fill the refund form with reason and evidence</li>
                <li>Submit your request</li>
              </ol>
              <p className="text-gray-600 leading-relaxed mt-3">
                Alternatively, email us at team@agentcroww.com with your order ID and refund reason.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">6.2 Processing Timeline</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li><strong>Initial Response:</strong> Within 48 hours</li>
                <li><strong>Decision:</strong> Within 5-7 business days</li>
                <li><strong>Refund Processing:</strong> Within 7-10 business days after approval</li>
                <li><strong>Bank Credit:</strong> 3-5 additional business days depending on payment method</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">6.3 Refund Method</h3>
              <p className="text-gray-600 leading-relaxed">
                Refunds are processed to the original payment method:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>UPI payments: Credited to the same UPI ID</li>
                <li>Debit/Credit cards: Credited to the original card</li>
                <li>Net Banking: Credited to the source bank account</li>
                <li>Wallets: Credited to the original wallet</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Commission & Payout Implications</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">7.1 For Vendors</h3>
              <p className="text-gray-600 leading-relaxed">
                If a refund is issued:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>The sale will be reversed from vendor records</li>
                <li>Commission retained by Platform will be returned to customer</li>
                <li>Vendor portion will be deducted from pending payouts</li>
                <li>If already paid out, vendor owes the amount back to Platform</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">7.2 For Sellers</h3>
              <p className="text-gray-600 leading-relaxed">
                If a sale facilitated by a seller is refunded:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Seller commission will be reversed</li>
                <li>If commission was already paid, it will be deducted from future earnings</li>
                <li>Excessive refunds may result in account review</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">7.3 Cooling Period</h3>
              <p className="text-gray-600 leading-relaxed">
                A 15-day cooling period applies before commissions are released to vendors and sellers. This protects against:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Potential refund requests within the 7-day window</li>
                <li>Payment verification and fraud checks</li>
                <li>Transaction settlement time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Order Cancellation</h2>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">8.1 Before Delivery</h3>
              <p className="text-gray-600 leading-relaxed">
                Customers can cancel an order:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Before downloading or accessing the digital content</li>
                <li>Within the 7-day cooling-off period</li>
                <li>Full refund will be processed automatically</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">8.2 Subscription Cancellation</h3>
              <p className="text-gray-600 leading-relaxed">
                For subscription-based products:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>Cancel anytime from Account Settings</li>
                <li>Access continues until the end of current billing period</li>
                <li>No prorated refunds for partial subscription periods</li>
                <li>Annual subscriptions: Refund within 7 days of renewal only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                If your refund request is denied and you believe it's unfair:
              </p>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 mt-2">
                <li>Escalate to our Grievance Officer at team@agentcroww.com</li>
                <li>We will review within 15 days</li>
                <li>If unresolved, you may approach consumer forums under Consumer Protection Act, 2019</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Vendor-Specific Policies</h2>
              <p className="text-gray-600 leading-relaxed">
                Vendors may offer more generous refund policies than stated here. If a vendor advertises a specific refund policy:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                <li>The vendor's stated policy will be honored</li>
                <li>Vendor is responsible for honoring their advertised terms</li>
                <li>Platform will facilitate processing as per vendor's policy</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Vendor policies cannot be less favorable than this Platform policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Important Notes</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>All refunds are processed in Indian Rupees (INR)</li>
                <li>Refund amount will be the price paid, excluding any platform fees absorbed</li>
                <li>We do not charge any refund processing fees</li>
                <li>Currency conversion losses (if any) are borne by the customer</li>
                <li>GST on refunds will be reversed as per GST law provisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact for Refunds</h2>
              <p className="text-gray-600 leading-relaxed">
                For refund requests or questions:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Email:</strong> team@agentcroww.com</p>
                <p className="text-gray-700"><strong>Response Time:</strong> Within 48 hours</p>
                <p className="text-gray-700"><strong>Operated by:</strong> Rookus</p>
                <p className="text-gray-700 mt-2"><em>Include your Order ID for faster processing</em></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
