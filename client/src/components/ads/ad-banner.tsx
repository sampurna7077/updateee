import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { X } from 'lucide-react';

interface AdBannerProps {
  position: 'left' | 'right' | 'both';
  className?: string;
}

export function AdBanner({ position, className = '' }: AdBannerProps) {
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());

  const { data: ads } = useQuery({
    queryKey: ['/api/advertisements', position],
    queryFn: async () => {
      const url = position === 'both' 
        ? '/api/advertisements' 
        : `/api/advertisements?position=${position}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: (adId: string) => apiRequest('POST', `/api/advertisements/${adId}/click`),
  });

  const trackImpressionMutation = useMutation({
    mutationFn: (adId: string) => apiRequest('POST', `/api/advertisements/${adId}/impression`),
  });

  const handleAdClick = (ad: Advertisement) => {
    trackClickMutation.mutate(ad.id);
    
    // Navigate to the ad's link if one is provided
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDismissAd = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAds(prev => new Set([...Array.from(prev), adId]));
  };

  useEffect(() => {
    // Track impressions for visible ads
    if (ads && Array.isArray(ads)) {
      ads.forEach((ad: Advertisement) => {
        if (!dismissedAds.has(ad.id)) {
          trackImpressionMutation.mutate(ad.id);
        }
      });
    }
  }, [ads, dismissedAds]);

  if (!ads || !Array.isArray(ads) || ads.length === 0) {
    // Return null when no ads are available (empty display)
    return null;
  }

  // Filter ads by position and dismissed status
  const filteredAds = ads
    .filter((ad: Advertisement) => {
      // Filter out dismissed ads
      if (dismissedAds.has(ad.id)) return false;
      
      // If position is 'both', show all ads. Otherwise, filter by position
      if (position === 'both') return true;
      return ad.position === position;
    });

  if (filteredAds.length === 0) {
    return null;
  }

  console.log(`[AdBanner ${position}] Rendering ${filteredAds.length} ads`);

  return (
    <div className={`w-full ${className}`}>
      {/* Grid layout: 1 x number of ads */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAds.map((ad: Advertisement) => (
        <div
          key={ad.id}
          className="relative group cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-purple-300 dark:hover:border-purple-600 w-full"
          onClick={() => handleAdClick(ad)}
          data-testid={`ad-banner-${ad.id}`}
        >
          <button
            onClick={(e) => handleDismissAd(ad.id, e)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full p-1"
            data-testid={`ad-dismiss-${ad.id}`}
            aria-label="Dismiss ad"
          >
            <X className="h-3 w-3 text-slate-600 dark:text-slate-300" />
          </button>

          {ad.filePath && (
            <div className="mb-3 w-full">
              <img
                src={ad.filePath}
                alt={ad.title}
                className="w-full h-32 sm:h-24 md:h-32 lg:h-24 xl:h-32 object-cover rounded-lg shadow-sm"
                loading="lazy"
                data-testid={`ad-image-${ad.id}`}
                onError={(e) => {
                  console.error('Failed to load ad image:', ad.filePath);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2">
              {ad.title}
            </h3>
            
            {ad.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                {ad.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  📢 Sponsored
                </span>
                {ad.link && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    🔗 Click to visit
                  </span>
                )}
              </div>
              {ad.fileType === 'gif' && (
                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-medium">
                  🎬 GIF
                </span>
              )}
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}