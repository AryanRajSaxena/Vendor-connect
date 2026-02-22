'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">VendorConnect</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              A commission-based marketplace connecting vendors, sellers, and customers in India.
            </p>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-semibold mb-4">For Vendors</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/vendor/dashboard" className="hover:text-white transition">Vendor Dashboard</Link></li>
              <li><Link href="/vendor/add-product" className="hover:text-white transition">Add Product</Link></li>
              <li><Link href="/vendor/sales" className="hover:text-white transition">Sales Tracking</Link></li>
              <li><Link href="/vendor/analytics" className="hover:text-white transition">Analytics</Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="font-semibold mb-4">For Sellers</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/seller/dashboard" className="hover:text-white transition">Seller Dashboard</Link></li>
              <li><Link href="/seller/marketplace" className="hover:text-white transition">Marketplace</Link></li>
              <li><Link href="/seller/earnings" className="hover:text-white transition">Earnings</Link></li>
              <li><Link href="/seller/training" className="hover:text-white transition">Training Center</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@vendorconnect.in" className="hover:text-white transition">
                  support@vendorconnect.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+919876543210" className="hover:text-white transition">
                  +91 9876543210
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-800 pt-8 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} VendorConnect. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
