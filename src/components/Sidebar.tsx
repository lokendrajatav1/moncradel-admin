"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home, Users, ShoppingCart, Utensils, CreditCard,
  Settings, LayoutDashboard, Package, TrendingUp,
  RefreshCcw, Image, Tag, Bell, ShieldAlert,
  Star, Wallet, HeadphonesIcon, ChevronLeft, ChevronRight,
  ShoppingBag, Layers, Calendar, Baby, ClipboardList, Pill, Sparkles, LogOut, Trophy, FileText, Syringe, HelpCircle, ChevronDown, MonitorPlay, Truck, Stethoscope
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = searchParams && searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Auto-close dropdowns when navigating to a different main tab
  useEffect(() => {
    setExpandedMenus({});
  }, [pathname]);

  const toggleMenu = (name: string, isActive: boolean) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus(prev => ({ ...prev, [name]: true }));
    } else {
      setExpandedMenus(prev => {
        const currentlyExpanded = prev[name] !== undefined ? prev[name] : isActive;
        return { ...prev, [name]: !currentlyExpanded };
      });
    }
  };

  const menuItems = [
    { name: 'Dashboard Analytics', icon: LayoutDashboard, href: '/' },
    {
      name: 'Users',
      icon: Users,
      href: '/users'
    },
    {
      name: 'Babies Management',
      icon: Baby,
      href: '/babies'
    },
    {
      name: 'Healthcare & Medical',
      icon: Stethoscope,
      subItems: [
        { name: 'Appointments', href: '/appointments' },
        { name: 'Prescriptions', href: '/prescriptions' },
        { name: 'Nutrition Plans', href: '/nutrition-plans' },
        { name: 'Standard Milestones', href: '/standard-milestones' },
        { name: 'Vaccines', href: '/vaccines' },
      ]
    },
    {
      name: 'Operations',
      icon: ShoppingCart,
      subItems: [
        { name: 'Product Management', href: '/products' },
        { name: 'Order Management', href: '/orders' },
        { name: 'Kitchen Management', href: '/meals' },
        { name: 'Inventory Monitoring', href: '/inventory' },
        { name: 'Batch Management', href: '/batches' },
        { name: 'Hygiene & Quality', href: '/hygiene' },
      ]
    },
    {
      name: 'Finance & Plans',
      icon: TrendingUp,
      subItems: [
        { name: 'Revenue Reports', href: '/payouts' },
        { name: 'Payment Reports', href: '/payments' },
        { name: 'Subscription Plans', href: '/subscription-plans' },
        { name: 'Subscriptions', href: '/subscriptions' },
      ]
    },
    {
      name: 'Marketing & CMS',
      icon: Image,
      subItems: [
        { name: 'CMS (Articles)', href: '/articles' },
        { name: 'Banner Management', href: '/banners' },
        { name: 'Coupon Management', href: '/coupons' },
        { name: 'FAQs Management', href: '/faqs' },
        { name: 'User Reviews', href: '/reviews' },
      ]
    },
    {
      name: 'System & Logs',
      icon: Settings,
      subItems: [
        { name: 'Notification Center', href: '/notifications' },
        { name: 'Support & Helpdesk', href: '/support' },
        { name: 'Audit Logs', href: '/audit-logs' },
        { name: 'System Settings', href: '/settings' },
      ]
    }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white h-screen flex flex-col border-r border-gray-200 fixed left-0 top-0 transition-all duration-300 z-20`}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} shrink-0 relative`}>
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <LayoutDashboard className="h-8 w-8 text-blue-600 shrink-0" />
          {!isCollapsed && <span className="text-xl font-bold text-gray-900 whitespace-nowrap">moncradle</span>}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 p-1 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-blue-600 transition-colors z-30 shadow-sm"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="mt-2 px-4 pb-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              if (item.subItems) {
                const isActive = item.subItems.some(sub => currentUrl === sub.href || currentUrl.startsWith(sub.href));
                // Auto-expand if active, unless explicitly collapsed by user
                const isExpanded = expandedMenus[item.name] !== undefined ? expandedMenus[item.name] : isActive;

                return (
                  <li key={item.name} className="flex flex-col gap-1">
                    <button
                      onClick={() => toggleMenu(item.name, isActive)}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 w-full ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                        {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!isCollapsed && isExpanded && (
                      <ul className="px-2 py-2 space-y-1 mt-1 bg-gray-50/80 rounded-lg border border-gray-100 ml-2">
                        {item.subItems.map(sub => {
                          const isSubActive = currentUrl === sub.href || currentUrl.startsWith(sub.href);
                          return (
                            <li key={sub.name}>
                              <Link
                                href={sub.href}
                                className={`block px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${isSubActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-white' : 'bg-gray-300'}`} />
                                  {sub.name}
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const isActive = currentUrl === item.href || (item.href !== '/' && currentUrl.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href!}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-blue-600 text-white font-medium shadow-md'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
