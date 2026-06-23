
"use client"

import * as React from "react"
import {
  Home,
  ClipboardCheck,
  History,
  Library,
  ShieldCheck,
  LogOut,
  Settings,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { ThemeToggle } from "@/components/theme-toggle"

const LOGO_URL = "https://th.bing.com/th/id/R.3a932334ad4239b19672a1899a1eca35?rik=M8Bl24brJuLnoTA&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fcit-logo-vector-png-cit-university-logo-765.gif&ehk=Z6uAarlxy66eMWv45sko1xzQcGBiuomXJT%2bZIG%2fLgRw%3d&risl=&pid=ImgRaw&r=0"

const navItems = [
  { name: "Feed", href: "/", icon: Home },
  { name: "Suggestions", href: "/suggestions", icon: Lightbulb },
  { name: "Stress Assessment", href: "/assess", icon: ClipboardCheck },
  { name: "My History", href: "/history", icon: History },
  { name: "Resource Library", href: "/resources", icon: Library },
]

const adminItems = [
  { name: "Moderation", href: "/admin", icon: ShieldCheck },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "studentProfiles", user.uid)
  }, [db, user?.uid])

  const adminRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "roles_admin", user.uid)
  }, [db, user?.uid])

  const { data: profile } = useDoc(profileRef)
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRef)

  const handleSignOut = async () => {
    await auth.signOut()
    router.push("/login")
  }

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user?.email?.split('@')[0]
  const initials = profile?.firstName ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase() : user?.email?.[0].toUpperCase()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 py-4">
        <div className="flex items-center group-data-[collapsible=icon]:justify-center px-2 group-data-[collapsible=icon]:px-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-secondary/20 shadow-md">
              <Image 
                src={LOGO_URL} 
                alt="CIT Logo" 
                fill 
                className="object-cover"
                data-ai-hint="university logo"
              />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
              <span className="font-headline text-base font-bold leading-none tracking-tight text-secondary truncate">Safe Space</span>
              <span className="text-[10px] font-medium text-muted-foreground truncate">Student Support Hub</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-headline uppercase tracking-widest text-[9px] text-muted-foreground/60">Profile</SidebarGroupLabel>
            <SidebarGroupContent>
              <Link href="/profile" className="flex items-center gap-3 px-2 py-1.5 hover:bg-sidebar-accent rounded-md transition-colors group min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <Avatar className="h-8 w-8 shrink-0 border border-secondary/20 bg-secondary/10 group-hover:border-secondary transition-colors">
                  <AvatarImage src={profile?.photoUrl || `https://picsum.photos/seed/${user.uid}/100`} className="object-cover" />
                  <AvatarFallback className="text-[10px] font-bold text-secondary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                  <span className="text-xs font-bold truncate text-foreground">{displayName}</span>
                  {profile?.studentIdNumber && (
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter truncate">
                      ID: {profile.studentIdNumber}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground truncate">{user.email}</span>
                </div>
              </Link>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="font-headline uppercase tracking-widest text-[9px] text-muted-foreground/60">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-10 transition-all hover:translate-x-1"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium text-xs">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-headline uppercase tracking-widest text-[9px] text-muted-foreground/60">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/profile"}
                  tooltip="Profile Settings"
                  className="h-10 transition-all hover:translate-x-1"
                >
                  <Link href="/profile">
                    <Settings className="h-4 w-4" />
                    <span className="font-medium text-xs">Profile Customization</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminRole && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-headline uppercase tracking-widest text-[9px] text-muted-foreground/60">Admin Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.name}
                      className="h-10 transition-all hover:translate-x-1"
                    >
                      <Link href={item.href}>
                        <ShieldCheck className="h-4 w-4" />
                        <span className="font-medium text-xs">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              className="h-10 text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-xs">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
