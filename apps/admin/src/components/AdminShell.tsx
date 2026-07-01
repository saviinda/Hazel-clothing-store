'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { supabase } from '@/lib/supabase';
import { User, AdminRole } from '@hazel/shared';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tag, 
  FolderTree, 
  Boxes, 
  FileEdit, 
  Settings, 
  LogOut, 
  UserCircle,
  Loader2,
  Shield,
  Users,
  Menu,
  X
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cache the profile so we never re-fetch on route changes
  const profileLoaded = useRef(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [isMobileMenuOpen]);

  // Load user profile when pathname changes
  useEffect(() => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // If profile is already loaded and is the same user, skip DB query
        if (profileLoaded.current && userProfile?.id === user.id) {
          setLoading(false);
          return;
        }

        // Fetch custom profile role from 'users' table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        let finalProfile = profile as User | null;

        // Force known accounts to correct roles
        if (user.email === 'superadmin@hazel.lk' || user.email === 'superadmin@hazel.com') {
          finalProfile = {
            id: user.id,
            name: profile?.name || 'Super Admin',
            email: user.email,
            role: 'Super Admin',
            is_active: true,
            created_at: profile?.created_at || new Date().toISOString()
          };
        } else if (user.email === 'admin@hazel.com') {
          finalProfile = {
            id: user.id,
            name: profile?.name || 'Admin',
            email: user.email,
            role: 'Admin',
            is_active: true,
            created_at: profile?.created_at || new Date().toISOString()
          };
        } else if (user.email === 'staff@hazel.com') {
          finalProfile = {
            id: user.id,
            name: profile?.name || 'Staff Member',
            email: user.email,
            role: 'Staff',
            is_active: true,
            created_at: profile?.created_at || new Date().toISOString()
          };
        }

        if (finalProfile) {
          setUserProfile(finalProfile);
        } else {
          setUserProfile({
            id: user.id,
            name: user.user_metadata?.name || 'Administrator',
            email: user.email || '',
            role: 'Staff',
            is_active: true,
            created_at: new Date().toISOString()
          });
        }

        profileLoaded.current = true;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Subscribe to changes on the current user's record in 'users' table
  useEffect(() => {
    if (!userProfile?.id) return;

    const channel = supabase
      .channel(`self-profile-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userProfile.id}`
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(prev => prev ? { ...prev, ...payload.new } : (payload.new as User));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const handleLogout = async () => {
    profileLoaded.current = false;
    setUserProfile(null);
    setLoading(true);
    await logoutAction();
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const role: AdminRole = userProfile?.role || 'Staff';
  const isSuperOrAdmin = role === 'Super Admin' || role === 'Admin';

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/customers', icon: UserCircle },
    { label: 'Products', path: '/products', icon: Tag },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Store CMS', path: '/content', icon: FileEdit, hide: !isSuperOrAdmin },
    { label: 'Role Permissions', path: '/roles', icon: Shield, hide: !isSuperOrAdmin },
    { label: 'User Management', path: '/users', icon: Users, hide: !isSuperOrAdmin },
    { label: 'Settings & Profile', path: '/settings', icon: Settings },
  ];

  const currentPageLabel =
    menuItems.find((item) => item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path)))?.label || 'Dashboard';

  // Show a skeleton shell while loading — sidebar stays visible, only main content shows spinner
  const sidebarContent = (
    <aside className={`
      fixed top-16 bottom-0 left-0 z-40 transform bg-brand-secondary text-brand-primary-cream flex flex-col justify-between flex-shrink-0 border-r border-brand-primary/10 w-[min(100%,280px)] transition-transform duration-300 ease-in-out
      md:top-0 md:relative md:translate-x-0 md:w-64 md:h-full
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div>
        {/* Brand Header */}
        <div className="flex h-16 md:h-20 items-center justify-center border-b border-brand-primary-cream/10 px-4">
          <Link href="/" className="flex flex-col items-center gap-0.5">
            <span className="font-serif text-2xl font-bold tracking-[0.12em] text-brand-primary-cream leading-none">HAZEL</span>
            <span className="text-[7px] tracking-[0.28em] text-[#d4a373] uppercase font-medium">Admin Portal</span>
          </Link>
        </div>

        {/* Links menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            if (item.hide) return null;
            const Icon = item.icon;
            const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded transition duration-200 ${
                  active 
                    ? 'bg-brand-primary text-white shadow' 
                    : 'hover:bg-brand-primary-light/5 text-brand-primary-cream/70 hover:text-brand-primary-cream'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-brand-primary-cream/10 space-y-4">
        {loading ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-brand-primary-cream/10 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 bg-brand-primary-cream/10 rounded animate-pulse" />
              <div className="h-2 w-16 bg-brand-primary-cream/10 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <UserCircle size={36} className="text-brand-primary" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userProfile?.name || 'Admin User'}</p>
              <span className="inline-flex items-center rounded-full bg-brand-primary/15 px-2 py-0.5 text-[9px] font-bold text-brand-primary-light uppercase">
                {role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded text-red-400 hover:bg-red-500/5 hover:text-red-300 transition duration-200"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-brand-primary-cream">
      {/* Mobile Top Header */}
      <div className="md:hidden flex h-16 w-full items-center justify-between bg-brand-secondary text-brand-primary-cream px-4 fixed top-0 z-50">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.2em] text-brand-primary-light uppercase truncate">Hazel Admin</p>
          <p className="font-serif text-sm font-bold tracking-wide truncate">{currentPageLabel}</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="touch-target inline-flex items-center justify-center shrink-0"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      {sidebarContent}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Panel */}
      <div className="flex flex-col flex-1 h-full overflow-hidden w-full min-w-0 pt-16 md:pt-0">
        {/* Top Header (Desktop) */}
        <header className="hidden md:flex h-20 items-center justify-between border-b border-brand-primary-light/20 bg-white px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-6 w-1 rounded-full bg-brand-primary inline-block shrink-0" />
            <h2 className="font-serif text-xl lg:text-2xl font-bold text-brand-secondary truncate">
              {currentPageLabel}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-brand-secondary/50">
            <span>Server status: Online</span>
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow shadow-green-400" />
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-zinc-50/50 relative w-full min-w-0">
          {loading ? (
            // Show skeleton in content area while loading — layout stays intact
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-brand-primary" size={32} />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
