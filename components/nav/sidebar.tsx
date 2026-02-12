'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MapPin,
  Leaf,
  FlaskConical,
  BarChart2,
  Bell,
  BookOpen,
  Sun,
  Users,
  FileText,
  Menu,
  X,
  Bug,
  Calculator,
  ShieldCheck,
  Award,
  LeafyGreen,
  Landmark,
  MoreHorizontal,
} from 'lucide-react';

const COLLAPSED_WIDTH = 76;
const EXPANDED_WIDTH = 260;

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Market Rates', href: '/market', icon: BarChart2 },
  { name: 'Advisories', href: '/advisories', icon: Bell },
  { name: 'Soil Analysis', href: '/soil', icon: Leaf },
  { name: 'Crop Guide', href: '/crop-guide', icon: BookOpen },
  { name: 'Weather', href: '/weather', icon: Sun },
  { name: 'Scouting', href: '#', icon: MapPin },
  { name: 'Reports', href: '#', icon: FileText },
  { name: 'Services', href: '#', icon: FlaskConical },
  { name: 'More', href: '#', icon: MoreHorizontal, isMore: true },
];

const moreOptions = [
  { name: 'Plant Disease', icon: Bug },
  { name: 'Cost Analysis', icon: Calculator },
  { name: 'Insurance & Claims', icon: ShieldCheck },
  { name: 'Farm Certification', icon: Award },
  { name: 'Carbon Credits', icon: LeafyGreen },
  { name: 'Govt DBT Schemes', icon: Landmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!open) setShowMore(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  /* ---- PUSH LAYOUT ---- */
  useEffect(() => {
    if (open) {
      document.body.classList.add('sidebar-pinned');
    } else {
      document.body.classList.remove('sidebar-pinned');
    }

    return () => {
      document.body.classList.remove('sidebar-pinned');
    };
  }, [open]);

  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  /* ---- MENU BUTTON ---- */
  const handleMenuClick = () => {
    setOpen(true);
  };

  /* ---- CLOSE BUTTON ---- */
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 h-screen z-[9999] overflow-visible transition-[width] duration-300 ease-in-out"
      style={{
        width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
        background: 'rgba(10, 22, 40, 0.95)',
      }}
    >
      <div
        className="h-full flex flex-col"
        style={{ width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      >
        {/* ===== TOP ===== */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen((p) => !p)} // toggles open/close
              className="p-1 rounded-lg hover:bg-white/10 transition z-50"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <span
              className={cn(
                'text-lg font-semibold text-white whitespace-nowrap transition-all duration-300',
                open
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-4 pointer-events-none',
              )}
            >
              KISAAN SAATHI
            </span>
          </div>

          {open && (
            <button
              onClick={handleClose}
              className="p-3 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* ===== NAV ===== */}
        <nav className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <div key={item.name} className="flex flex-col">
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.isMore) {
                      e.preventDefault();
                      setShowMore((p) => !p); // toggle submenu
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    open && 'hover:bg-white/10 hover:text-white',
                    active && open && 'bg-white/15',
                    active ? 'text-primary' : 'text-white/80',
                  )}
                  style={{
                    textDecoration: 'none'
                  }}
                >
                  <div
                    className={cn(
                      'relative flex items-center justify-center w-8 h-8 px-2 rounded-md transition-colors',
                      !open && 'hover:bg-white/15',
                      active && !open && 'bg-white/25',
                    )}
                    onClick={() => setOpen(true)}
                    onMouseEnter={(e) => {
                      if (open) return;
                      const iconRect = e.currentTarget.getBoundingClientRect();
                      const sidebarRect = e.currentTarget
                        .closest('aside')!
                        .getBoundingClientRect();
                      setTooltip({
                        text: item.name,
                        x: sidebarRect.right + 8,
                        y: iconRect.top + iconRect.height / 2,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0',
                        active ? 'text-primary' : 'text-white',
                      )}
                    />
                  </div>

                  <span
                    className={cn(
                      'whitespace-nowrap transition-all duration-300 text-decoration-none',
                      open
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4 pointer-events-none',
                    )}
                  >
                    {item.name}
                  </span>
                </a>
              </div>
            );
          })}
        </nav>
      </div>

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            zIndex: 100000,
          }}
          className="rounded-md bg-black px-2 py-1 text-xs text-white shadow-lg pointer-events-none"
        >
          {tooltip.text}
        </div>
      )}

      {showMore && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: open ? EXPANDED_WIDTH + 8 : COLLAPSED_WIDTH + 8,
            bottom: 90,
            background: '#fff',
            borderRadius: 10,
            minWidth: 220,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          {moreOptions.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer"
                style={{ whiteSpace: 'nowrap' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#f1f5f9')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Icon className="w-4 h-4 text-gray-700" />
                <span className="text-gray-800">{item.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
