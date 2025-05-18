'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { cn } from '@/lib/utils';

export function NavBar() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <nav className="flex items-center ml-auto space-x-4">
          <a 
            href="/" 
            className={cn(
              "text-sm font-medium",
              pathname === "/" 
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Calendar
          </a>
          <a 
            href="/tasks" 
            className={cn(
              "text-sm font-medium",
              pathname === "/tasks" 
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tasks
          </a>
        </nav>
      </div>
    </header>
  );
} 