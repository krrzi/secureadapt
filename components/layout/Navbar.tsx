'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Swords,
  User,
  LogOut,
  Settings,
  BarChart3,
  BookOpen,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface NavbarProps {
  profile: Profile | null;
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  const isAdmin = profile?.rol === 'admin';

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: '/entrenamiento',
      label: 'Entrenar',
      icon: <Swords className="w-4 h-4" />,
    },
    {
      href: '/perfil',
      label: 'Mi Perfil',
      icon: <User className="w-4 h-4" />,
    },
    {
      href: '/metodologia',
      label: 'Metodología',
      icon: <BookOpen className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            href: '/escenarios',
            label: 'Escenarios (Admin)',
            icon: <Settings className="w-4 h-4" />,
          },
          {
            href: '/metricas',
            label: 'Métricas Globales',
            icon: <BarChart3 className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-surface-200 sticky top-0 z-40">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-surface-900 group"
          >
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-surface-900 leading-none text-base tracking-tight">
                SecureAdapt
              </span>
              <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mt-0.5">
                Investigación Universitaria
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href + '/'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm font-semibold'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Profile info + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-50 py-1.5 px-3 rounded-full border border-surface-200">
              <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                {profile?.nombre?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-xs font-medium text-surface-700 max-w-[120px] truncate">
                {profile?.nombre ?? profile?.email ?? 'Usuario'}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost p-2 text-surface-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-surface-600 hover:bg-surface-100"
              aria-label="Abrir menú"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white px-4 py-4 space-y-1 animate-slide-up">
          <div className="pb-3 mb-2 border-b border-surface-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-surface-800">
                {profile?.nombre ?? 'Usuario'}
              </p>
              <p className="text-xs text-surface-500">{profile?.email}</p>
            </div>
            {isAdmin && (
              <span className="badge bg-purple-100 text-purple-700">Admin</span>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                pathname === link.href
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-surface-600 hover:bg-surface-50'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-surface-100 mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
