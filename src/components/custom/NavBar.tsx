'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuthTabs } from './AuthForms';

export function NavBar() {
  const pathname = usePathname();
  const { user, signOut, isLoading } = useAuth();
  
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
          <a 
            href="/videos" 
            className={cn(
              "text-sm font-medium",
              pathname === "/videos" 
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Videos
          </a>
          
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut()}
                className="text-muted-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 mr-1" />
                  Sign In
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col items-center justify-center">
                <SheetHeader className="w-full max-w-md mb-6">
                  <SheetTitle className="text-center">Welcome to Consistency</SheetTitle>
                  <SheetDescription className="text-center">
                    Sign in to your account or create a new one to track your consistency
                  </SheetDescription>
                </SheetHeader>
                <AuthTabs />
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </div>
    </header>
  );
} 