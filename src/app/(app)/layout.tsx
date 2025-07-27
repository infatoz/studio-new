
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
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Bell,
  BookText,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Search,
  Settings,
  Sparkles,
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
import { Input } from '@/components/ui/input';

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
  { href: '/quiz-generator', icon: FileQuestion, label: 'Quiz Generator' },
  { href: '/interactive-story', icon: Sparkles, label: 'Interactive Story' },
  { href: '/lesson-planner', icon: ClipboardList, label: 'Lesson Planner' },
];

function Logo() {
  return (
     <div className="flex items-center justify-center size-8 bg-primary rounded-lg text-primary-foreground font-bold text-lg">
        S
     </div>
  )
}

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
    // The AuthProvider will handle the redirect.
    // Returning null here prevents the layout from rendering while the redirect is in progress.
    return null;
  }

  const isGuest = user.isAnonymous;
  const userName = isGuest ? "Guest User" : user.displayName || "User";
  const userEmail = isGuest ? "guest@sahayak.ai" : user.email || "";

  return (
    <SidebarProvider>
      <Sidebar variant='inset' collapsible='icon'>
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2">
            <Logo />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">Sahayak AI</h2>
              <p className="text-xs text-muted-foreground">Teaching Assistant</p>
            </div>
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
                  className="justify-start [&>svg]:size-5"
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
           <SidebarGroup className="p-2 mt-auto">
             <div className="p-4 rounded-lg bg-muted flex flex-col items-center text-center gap-2 group-data-[collapsible=icon]:hidden">
                <HelpCircle className="size-8 text-primary"/>
                <p className="font-semibold">Need Help?</p>
                <p className="text-xs text-muted-foreground">Get AI-powered assistance</p>
                <Button size="sm" className="w-full mt-2">Get Help</Button>
            </div>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
            <Input
              placeholder="Search content, lessons, tools..."
              className="w-full md:w-2/3 lg:w-1/3 pl-10 bg-background"
            />
          </div>
          <Button className='gap-2'>
            <Sparkles className="size-5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
              <span className="sr-only">Notifications</span>
            </Button>
             <Button variant="ghost" size="icon">
              <Settings className="size-5" />
              <span className="sr-only">Settings</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start gap-2 px-2 h-auto">
                  <Avatar className="size-9">
                    <AvatarImage src={user.photoURL ?? ''} alt={userName} />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-left hidden lg:block'>
                      <p className='text-sm font-medium'>{userName}</p>
                      <p className='text-xs text-muted-foreground'>
                        {isGuest ? "Teacher" : (userEmail || "Teacher")}
                      </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
