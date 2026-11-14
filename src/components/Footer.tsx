import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#0b0c10] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: ASTRA VESPER */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-semibold tracking-wider text-[#0b0c10] dark:text-white">
              ASTRA VESPER
            </h3>
            <ul className="space-y-2.5 text-[#4b5563] dark:text-slate-400">
              <li>
                <Link to="/about" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/about#ecosystem" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Our Ecosystem
                </Link>
              </li>
              <li>
                <Link to="/support/contact" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: EXPLORE */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-semibold tracking-wider text-[#0b0c10] dark:text-white">
              EXPLORE
            </h3>
            <ul className="space-y-2.5 text-[#4b5563] dark:text-slate-400">
              <li>
                <Link to="/applications" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Applications
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/solis-vexen" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Solis Vexen
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: SUPPORT */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-semibold tracking-wider text-[#0b0c10] dark:text-white">
              SUPPORT
            </h3>
            <ul className="space-y-2.5 text-[#4b5563] dark:text-slate-400">
              <li>
                <Link to="/support/help" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/services#faqs" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/support/safety" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Safety &amp; Security
                </Link>
              </li>
              <li>
                <Link to="/support/privacy" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/support/terms" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ACCOUNT */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-semibold tracking-wider text-[#0b0c10] dark:text-white">
              ACCOUNT
            </h3>
            <ul className="space-y-2.5 text-[#4b5563] dark:text-slate-400">
              <li>
                <Link to="/account" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/account?mode=create" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#0b0c10] dark:hover:text-white transition-colors">
                  Account Management
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Credit */}
        <div className="mt-12 pt-8 border-t border-black/8 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#4b5563] dark:text-slate-400">
          <div className="space-y-1">
            <p className="font-medium text-[#0b0c10] dark:text-slate-200">
              © 2026 Astra Vesper. All rights reserved.
            </p>
            <p>A Vioratundra digital ecosystem.</p>
          </div>
          <p className="text-[#4b5563] dark:text-slate-400">Crafted by Hari Chiranjeevi.</p>
        </div>
      </div>
    </footer>
  );
}
