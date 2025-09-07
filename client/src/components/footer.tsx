import { Link } from "wouter";
import { Globe, Facebook, Linkedin, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div data-testid="company-info">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                <img 
                  src="https://sampurna.easycare.edu.np/lgo.png" 
                  alt="Uddan Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Udaan Agencies</span>
            </div>
            <p className="text-slate-300 mb-6">Your trusted partner for international career and education opportunities.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-300 hover:text-white transition-colors" data-testid="social-facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors" data-testid="social-linkedin">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors" data-testid="social-twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors" data-testid="social-instagram">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div data-testid="services-links">
            <h3 className="font-display font-bold text-lg mb-6">Services</h3>
            <ul className="space-y-3 text-slate-300">
              <li><Link href="/jobs" className="hover:text-white transition-colors" data-testid="footer-link-jobs">Job Placement</Link></li>
              <li><Link href="/forms" className="hover:text-white transition-colors" data-testid="footer-link-study">Study Abroad</Link></li>
              <li><Link href="/forms" className="hover:text-white transition-colors" data-testid="footer-link-visa">Visa Counseling</Link></li>
              <li><Link href="/forms" className="hover:text-white transition-colors" data-testid="footer-link-documents">Document Review</Link></li>
              <li><Link href="/forms" className="hover:text-white transition-colors" data-testid="footer-link-consultation">Career Consultation</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div data-testid="resources-links">
            <h3 className="font-display font-bold text-lg mb-6">Resources</h3>
            <ul className="space-y-3 text-slate-300">
              <li><Link href="/resources" className="hover:text-white transition-colors" data-testid="footer-link-guides">Country Guides</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors" data-testid="footer-link-blog">Blog</Link></li>
              <li><Link href="/feedbacks" className="hover:text-white transition-colors" data-testid="footer-link-stories">Success Stories</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors" data-testid="footer-link-faq">FAQ</Link></li>
              <li><Link href="/resources" className="hover:text-white transition-colors" data-testid="footer-link-downloads">Downloads</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div data-testid="contact-info">
            <h3 className="font-display font-bold text-lg mb-6">Contact</h3>
            <div className="space-y-3 text-slate-300">
              <p className="flex items-center" data-testid="contact-email">
                <Mail className="mr-3 h-4 w-4" />
                info.udaanagencies@gmail.com
              </p>
              <p className="flex items-center" data-testid="contact-phone">
                <Phone className="mr-3 h-4 w-4" />
                +977-9705666444
              </p>
              <p className="flex items-center" data-testid="contact-address">
                <MapPin className="mr-3 h-4 w-4" />
                Atithi Sadan Road, Birtamod Municipality, Jhapa, Nepal
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center" data-testid="footer-bottom">
          <div className="text-slate-300 text-sm mb-4 md:mb-0">
            <p>© 2025 Udaan Agencies. All rights reserved.</p>
            <p className="text-xs text-slate-400 mt-1">Developed by Udaan IT Team</p>
          </div>
          <div className="flex space-x-6 text-sm text-slate-300">
            <a href="https://udaanagencies.com.np/terms/" className="hover:text-white transition-colors" data-testid="footer-link-privacy">Privacy Policy</a>
            <a href="https://udaanagencies.com.np/terms/" className="hover:text-white transition-colors" data-testid="footer-link-terms">Terms of Service</a>
            <a href="https://udaanagencies.com.np/terms/" className="hover:text-white transition-colors" data-testid="footer-link-cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
