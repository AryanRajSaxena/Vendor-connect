'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Package } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-primary p-2 rounded-xl shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">VendorConnect</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              India's premier commission-based marketplace connecting vendors, sellers, and customers seamlessly.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-bold mb-4 text-white">For Vendors</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/vendor/dashboard" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Vendor Dashboard
              </Link></li>
              <li><Link href="/vendor/add-product" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Add Product
              </Link></li>
              <li><Link href="/vendor/sales" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Sales Tracking
              </Link></li>
              <li><Link href="/vendor/analytics" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Analytics
              </Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-bold mb-4 text-white">For Sellers</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/seller/dashboard" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Seller Dashboard
              </Link></li>
              <li><Link href="/seller/marketplace" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Marketplace
              </Link></li>
              <li><Link href="/seller/earnings" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Earnings
              </Link></li>
              <li><Link href="/seller/training" className="hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                <span className="w-1 h-1 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Training Center
              </Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-white">Contact Us</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <a href="mailto:support@vendorconnect.in" className="flex items-center gap-3 hover:text-white transition-colors duration-200 group">
                <div className="w-9 h-9 rounded-lg bg-gray-800 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span>support@vendorconnect.in</span>
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-3 hover:text-white transition-colors duration-200 group">
                <div className="w-9 h-9 rounded-lg bg-gray-800 group-hover:bg-primary-500 flex items-center justify-center transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+91 9876543210</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} VendorConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
            <Link href="/help" className="hover:text-white transition-colors duration-200">Help Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
