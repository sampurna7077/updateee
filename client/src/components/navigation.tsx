import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Globe, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Jobs" },
    { href: "/feedbacks", label: "Feedbacks" },
    { href: "/forms", label: "Services" },
    { href: "/resources", label: "Resources" },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <nav className="nav w-full fixed top-0 left-0 right-0 z-50" data-testid="navigation">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center" style={{height: '64px'}}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3" data-testid="logo">
            <div 
              className="w-12 h-12 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all 0.15s ease'
              }}
            >
              <img 
                src="https://sampurna.easycare.edu.np/lgo.png" 
                alt="Udaan Agencies Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <span 
              className="font-semibold text-xl"
              style={{color: 'var(--gray-900)'}}
            >
              Udaan Agencies
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2" data-testid="desktop-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActiveLink(item.href) ? 'active' : ''}`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Auth Section */}
          <div className="flex items-center space-x-4" data-testid="auth-section">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || user.email || ""} />
                      <AvatarFallback>
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.firstName || user.email?.split('@')[0]}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {(user.role === 'admin' || user.role === 'editor') && (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem data-testid="admin-link">
                          <User className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} data-testid="logout-button">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={handleLogin}
                className="btn btn-primary btn-md"
                data-testid="login-button"
              >
                Get Started
              </button>
            )}
            
          </div>
        </div>
      </div>
    </nav>
  );
}
