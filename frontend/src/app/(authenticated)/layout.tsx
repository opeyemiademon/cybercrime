'use client';

import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const user_code = Cookies.get('dems_user_id');

   useEffect(()=>{

  if(!user_code || user_code===null){
    window.location.href='/'
  }
},[])




if(!user_code || user_code===null){
    return 'Loading..'
  }


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <main 
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export default function AuthenticatedLayout({
  
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}
