'use client';

import Link from 'next/link';
import { Mail, MapPin, Instagram,} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-0">
      <div className="container-custom py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">

          {/* Brand / Logo */}
          <div className="flex flex-col gap-3 items-center md:items-start">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-primary-200/20">
                <img src="/images/icon.jpeg" alt="Agent Croww" className="w-10 h-10 object-cover" />
              </div>
              <span className="brand-money-font font-semibold text-[18px] tracking-tight text-white">Agent Croww</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              A commission-based marketplace connecting vendors and sellers across India.
            </p>
          </div>

          {/* Follow Us */}
          <div className="flex flex-col items-center">
            <h4 className="font-bold mb-3 text-white">Follow Us</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <a href="https://www.instagram.com/agentcroww?igsh=MXRlMWI0ZzAyY2c3bA==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors duration-200 group justify-center">
                <div className="w-8 h-8 rounded-lg bg-gray-800 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300">
                  <Instagram className="w-4 h-4" />
                </div>
                <span>@agentcroww</span>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end">
            <h4 className="font-bold mb-3 text-white">Contact Us</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <a href="mailto:team@agentcroww.com" className="flex items-center gap-3 hover:text-white transition-colors duration-200 group justify-center md:justify-end">
                <div className="w-8 h-8 rounded-lg bg-gray-800 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="break-all">team@agentcroww.com</span>
              </a>
              <div className="flex items-center gap-3 justify-center md:justify-end">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Policies Links */}
        <div className="border-t border-gray-800 pt-4 pb-4">
          <div className="flex items-center justify-center flex-wrap gap-4 text-sm">
            <a 
              href="/policies/privacy-policy.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <span className="text-gray-600">•</span>
            <a 
              href="/policies/refund-policy.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
            >
              Refund & Cancellation
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-4 pb-4 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Agent Croww. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <a href="mailto:team@agentcroww.com" className="hover:text-primary-400 transition-colors">team@agentcroww.com</a>
          </p>
        </div>

        {/* Product Attribution */}
        <div className="text-center py-4 border-t border-gray-800 text-xs text-gray-500">
          Operated by <span className="text-gray-400 font-medium">Rookus</span>
        </div>
      </div>
    </footer>
  );
}
