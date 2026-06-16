'use client';

import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch custom profile role from 'users' table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        let finalProfile = profile as User | null;

        // Force superadmin@hazel.lk and admin@hazel.com to correct roles locally in frontend shell
        if (user.email === 'superadmin@hazel.lk') {
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
          // Fallback if public profile does not exist yet (default to Staff)
          setUserProfile({
            id: user.id,
            name: user.user_metadata?.name || 'Administrator',
            email: user.email || '',
            role: 'Staff',
            is_active: true,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (pathname !== '/login') {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    setLoading(true); // show loader during logout
    await logoutAction();
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-primary-cream">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  const role: AdminRole = userProfile?.role || 'Staff';
  const isSuperOrAdmin = role === 'Super Admin' || role === 'Admin';

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Products', path: '/products', icon: Tag },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Inventory', path: '/inventory', icon: Boxes },
    { label: 'Store CMS', path: '/content', icon: FileEdit, hide: !isSuperOrAdmin },
    { label: 'Role Permissions', path: '/roles', icon: Shield, hide: !isSuperOrAdmin },
    { label: 'User Management', path: '/users', icon: Users, hide: !isSuperOrAdmin },
    { label: 'Settings & Logs', path: '/settings', icon: Settings, hide: !isSuperOrAdmin },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-primary-cream">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-secondary text-brand-primary-cream flex flex-col justify-between flex-shrink-0 border-r border-brand-primary/10">
        <div>
          {/* Brand Header — text only */}
          <div className="flex h-20 items-center justify-center border-b border-brand-primary-cream/10 px-6">
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
          <div className="flex items-center gap-3 px-2">
            <UserCircle size={36} className="text-brand-primary" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userProfile?.name || 'Admin User'}</p>
              <span className="inline-flex items-center rounded-full bg-brand-primary/15 px-2 py-0.5 text-[9px] font-bold text-brand-primary-light uppercase">
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded text-red-400 hover:bg-red-500/5 hover:text-red-300 transition duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between border-b border-brand-primary-light/20 bg-white px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-brand-primary inline-block" />
            <h2 className="font-serif text-2xl font-bold text-brand-secondary">
              {menuItems.find((item) => item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path)))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-brand-secondary/50">
            <span>Server status: Online</span>
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow shadow-green-400" />
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
