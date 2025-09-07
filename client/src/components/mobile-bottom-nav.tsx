import { useLocation } from "wouter";
import { Home, Briefcase, MessageSquare, FileText, BookOpen, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/feedbacks", label: "Reviews", icon: MessageSquare },
    { href: "/forms", label: "Services", icon: FileText },
    { href: "/resources", label: "Guides", icon: BookOpen },
  ];

  // Add auth item if user is logged in
  if (user) {
    if (user.role === 'admin' || user.role === 'editor') {
      navItems.push({ href: "/admin", label: "Admin", icon: User });
    }
  }

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 md:hidden shadow-lg">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={`touch-target flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-white scale-105' 
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
              style={{
                background: isActive ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent',
                minWidth: '64px',
                boxShadow: isActive ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none'
              }}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for phones with bottom gestures */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
}