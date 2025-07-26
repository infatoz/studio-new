
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import {
  BookText,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/local-content', icon: BookText, label: 'Hyper-Local Content' },
  {
    href: '/differentiated-materials',
    icon: GraduationCap,
    label: 'Differentiated Materials',
  },
  { href: '/knowledge-base', icon: Lightbulb, label: 'Knowledge Base' },
  { href: '/visual-aids', icon: ImageIcon, label: 'Visual Aids' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">Sahayak AI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full gap-2 p-2 h-auto">
                <Avatar className="size-8">
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                <div className='text-left group-data-[collapsible=icon]:hidden'>
                    <p className='text-sm font-medium'>{user.displayName}</p>
                    <p className='text-xs text-muted-foreground'>{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold md:text-xl">
            {navItems.find((item) => item.href === pathname)?.label ?? 'Dashboard'}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
