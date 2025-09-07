import { ReactNode } from 'react';
import { AdBanner } from '@/components/ads/ad-banner';

interface SidebarLayoutProps {
  children: ReactNode;
  className?: string;
  showAds?: boolean;
}

export function SidebarLayout({ children, className = '', showAds = true }: SidebarLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - Advertisement - Desktop Only */}
      {showAds && (
        <div className="hidden lg:block w-64 xl:w-72 p-3 shrink-0">
          <div className="sticky top-24 space-y-4">
            <AdBanner position="left" className="animate-fade-in-up" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right Sidebar - Advertisement - Desktop Only */}
      {showAds && (
        <div className="hidden xl:block w-72 p-3 shrink-0">
          <div className="sticky top-24 space-y-4">
            <AdBanner position="right" className="animate-fade-in-up" />
          </div>
        </div>
      )}
    </div>
  );
}