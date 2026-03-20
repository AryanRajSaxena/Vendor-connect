'use client';

import Link from 'next/link';
import { Mail, MapPin, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-0">
      <div className="container-custom py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-5">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mt-0">
              <a href="https://www.instagram.com/agentcroww?igsh=MXRlMWI0ZzAyY2c3bA==" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-2 text-white">Contact Us</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <a href="mailto:team@agentcroww.com" className="flex items-center gap-3 hover:text-white transition-colors duration-200 group">
                <div className="w-8 h-8 rounded-lg bg-gray-800 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="break-all">team@agentcroww.com</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-3 md:pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-400 text-sm text-center md:text-left">
            &copy; {currentYear} Agent Croww. All rights reserved.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
            <Link href="/help" className="hover:text-white transition-colors duration-200">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
