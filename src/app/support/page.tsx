'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  FileText,
  ShoppingCart,
  CreditCard,
  User,
  Package,
  Search,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'Orders',
    question: 'How do I track my order?',
    answer:
      'You can track your order by visiting the "Track Order" page and entering your order ID. You can find your order ID in the confirmation email sent after your purchase, or in your order history if you were logged in during checkout.',
  },
  {
    category: 'Orders',
    question: 'Can I cancel my order?',
    answer:
      'Yes, you can cancel your order within the cooling-off period (7 days from purchase) provided you have not accessed more than 30% of the content. Visit our Refund Policy page for complete details.',
  },
  {
    category: 'Orders',
    question: 'How long does it take for digital product access?',
    answer:
      'Access to digital products is typically granted immediately after successful payment. For some courses, the vendor may take up to 24 hours to manually enroll you. You will receive an email confirmation once access is granted.',
  },
  {
    category: 'Payment',
    question: 'What payment methods are accepted?',
    answer:
      'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Digital Wallets. Cash on Delivery (COD) is available for select products only.',
  },
  {
    category: 'Payment',
    question: 'Is my payment information secure?',
    answer:
      'Yes, we use industry-standard encryption and never store your full card details. All transactions are processed through secure payment gateways compliant with PCI DSS standards.',
  },
  {
    category: 'Payment',
    question: 'When will I receive my refund?',
    answer:
      'Approved refunds are processed within 7-10 business days. The amount will be credited to your original payment method. UPI refunds typically take 3-5 business days, while card refunds may take 5-7 business days.',
  },
  {
    category: 'Account',
    question: 'How do I create an account?',
    answer:
      'Click "Sign Up" in the navigation menu. Choose your role (Customer, Vendor, or Seller), fill in your details, and verify your email to start using the platform.',
  },
  {
    category: 'Account',
    question: 'I forgot my password. How do I reset it?',
    answer:
      'Click "Login" then "Forgot Password". Enter your registered email address and we will send you a reset link. The link expires in 30 minutes for security reasons.',
  },
  {
    category: 'Products',
    question: 'What types of products can I purchase?',
    answer:
      'Agent Croww is a marketplace for digital products including online courses, e-books, templates, software, digital graphics, and subscription-based content.',
  },
  {
    category: 'Products',
    question: 'What if the product I purchased is different from the description?',
    answer:
      'If a product is materially different from its description, you are eligible for a full refund within 7 days. Contact our support team with your order details and evidence of the discrepancy.',
  },
  {
    category: 'Vendor/Seller',
    question: 'How does the commission system work?',
    answer:
      'Vendors receive 80% of the sale price, Sellers earn 10% commission on sales they facilitate, and the Platform retains 10%. Commission is released after a 15-day cooling period.',
  },
  {
    category: 'Vendor/Seller',
    question: 'How do I withdraw my earnings?',
    answer:
      'Vendors and sellers can request withdrawals once they reach the minimum threshold (INR 500). Complete your KYC verification and bank details in your account settings. Withdrawals are processed within 3-5 business days.',
  },
  {
    category: 'Technical',
    question: 'What browsers are supported?',
    answer:
      'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, ensure your browser is updated to the latest version.',
  },
  {
    category: 'Technical',
    question: 'I am having trouble accessing my purchased content. What should I do?',
    answer:
      'First, try clearing your browser cache and cookies. If the issue persists, try a different browser or device. If you still face issues, contact our support team with your order ID and screenshots of the error.',
  },
];

const categories = ['All', ...new Set(faqData.map((item) => item.category))];

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      Orders: <ShoppingCart className="w-4 h-4" />,
      Payment: <CreditCard className="w-4 h-4" />,
      Account: <User className="w-4 h-4" />,
      Products: <Package className="w-4 h-4" />,
      'Vendor/Seller': <FileText className="w-4 h-4" />,
      Technical: <HelpCircle className="w-4 h-4" />,
    };
    return icons[category] || <HelpCircle className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
          <p className="text-gray-600 mb-8">
            Find answers to common questions or contact our support team
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
              />
            </div>
          </div>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">Response within 24-48 hours</p>
            <a
              href="mailto:team@agentcroww.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              team@agentcroww.com
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-4">Available Mon-Fri, 9 AM - 6 PM IST</p>
            <span className="text-gray-400">Coming Soon</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-sm text-gray-600 mb-4">For urgent issues only</p>
            <span className="text-gray-400">Available on request</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          {/* Category Tabs */}
          <div className="border-b border-gray-200 px-6 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="divide-y divide-gray-200">
            {filteredFAQs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No questions found matching your search.</p>
              </div>
            ) : (
              filteredFAQs.map((item, index) => (
                <div key={index} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-start gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{item.question}</p>
                        {expandedIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      {expandedIndex === index && (
                        <p className="text-gray-600 mt-2 text-sm leading-relaxed">{item.answer}</p>
                      )}
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Still need help */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to help you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:team@agentcroww.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
            <Link
              href="/track-order"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Track Your Order
            </Link>
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Support Hours</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM IST
              </p>
              <p>
                <strong>Saturday:</strong> 10:00 AM - 2:00 PM IST
              </p>
              <p>
                <strong>Sunday:</strong> Closed
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Related Resources</h3>
            </div>
            <div className="space-y-2 text-sm">
              <Link href="/terms" className="block text-blue-600 hover:text-blue-700">
                Terms of Service
              </Link>
              <Link href="/privacy" className="block text-blue-600 hover:text-blue-700">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="block text-blue-600 hover:text-blue-700">
                Refund & Cancellation Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
