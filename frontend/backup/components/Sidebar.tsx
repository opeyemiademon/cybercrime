'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  Users, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import Image from 'next/image';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Audit Trail', href: '/audit-trail', icon: FileText },
  { name: 'Users', href: '/users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-primary-900 to-primary-800 text-white
          transform transition-all duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-primary-700 relative">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'} flex-shrink-0`}>
                <Image 
                  src="/logo.png" 
                  alt="Chaintrivex Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="text-lg font-bold">Chaintrivex</h1>
                  <p className="text-xs text-primary-200">Evidence Integrity System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white text-primary-900 rounded-full p-1 shadow-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-all group relative
                    ${isCollapsed ? 'justify-center' : 'space-x-3'}
                    ${isActive 
                      ? 'bg-white text-primary-900 shadow-lg' 
                      : 'text-primary-100 hover:bg-primary-700'
                    }
                  `}
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary-700">
            {!isCollapsed ? (
              <>
                <div className="px-4 py-3 bg-primary-700 rounded-lg mb-3">
                  <p className="text-sm font-medium">Sarah Investigator</p>
                  <p className="text-xs text-primary-200">Investigator</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className="flex items-center space-x-3 px-4 py-2 w-full text-primary-100 hover:bg-primary-700 rounded-lg transition-colors mb-2"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <Link href='/' className="flex items-center space-x-3 px-4 py-2 w-full text-primary-100 hover:bg-primary-700 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </Link>
              </>
            ) : (
              <>
                <button 
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center px-4 py-2 w-full text-primary-100 hover:bg-primary-700 rounded-lg transition-colors group relative mb-2"
                  title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
                <Link href="/"
                  className="flex items-center justify-center px-4 py-2 w-full text-primary-100 hover:bg-primary-700 rounded-lg transition-colors group relative"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Logout
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
