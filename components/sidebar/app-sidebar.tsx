"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  BotIcon,
  CreditCardIcon,
  PhoneIcon,
  SettingsIcon,
  DatabaseIcon,
  MessageSquareIcon,
  BarChartIcon,
  HistoryIcon,
  SparklesIcon,
  LeafIcon,
  InfoIcon,
  MegaphoneIcon,
  ChevronDownIcon,
  Building2Icon,
  Scale as ScaleIcon,
  Key as KeyIcon,
  Webhook as WebhookIcon,
  Users as UsersIcon,
  ChevronLeft as ChevronLeftIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/app/providers"

import { NavSection } from "@/components/sidebar/nav-section"
import { WorkspaceSelector } from "@/components/sidebar/workspace-selector"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const data = {
  build: [
    {
      title: "Agents",
      url: "/assistants",
      icon: BotIcon,
    },
    {
      title: "Knowledge Base",
      url: "/kb",
      icon: DatabaseIcon,
    },
  ],
  deploy: [
    {
      title: "Phone Numbers",
      url: "/numbers",
      icon: PhoneIcon,
    },
    {
      title: "Batch Call",
      url: "/batch-call",
      icon: SparklesIcon,
    },
  ],
  monitor: [
    {
      title: "Call History",
      url: "/call-history",
      icon: HistoryIcon,
    },
    {
      title: "Chat History",
      url: "/chat-history",
      icon: MessageSquareIcon,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChartIcon,
    },
  ],
  system: [
    {
      title: "Organizations",
      url: "/organizations",
      icon: Building2Icon,
    },
    {
      title: "Billing",
      url: "/billing",
      icon: CreditCardIcon,
    },
    {
      title: "Settings",
      url: "/settings/workspace",
      icon: SettingsIcon,
    },
  ],
}

const settingsNavItems = [
  {
    title: "Limits",
    url: "/settings/limits",
    icon: ScaleIcon,
  },
  {
    title: "API Keys",
    url: "/settings/api-keys",
    icon: KeyIcon,
  },
  {
    title: "Webhooks",
    url: "/settings/webhooks",
    icon: WebhookIcon,
  },
  {
    title: "Workspace",
    url: "/settings/workspace",
    icon: UsersIcon,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isSettingsMode = pathname?.startsWith("/settings")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await auth.getSession()
        if (session?.data?.user) {
          setUser({
            name: session.data.user.name || session.data.user.email?.split("@")[0] || "User",
            email: session.data.user.email || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await auth.signOut()

      setUser(null)

      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      setIsLoggingOut(false)
      router.push("/login")
      router.refresh()
    }
  }

  const displayName = user?.name
    ? user.name.length > 15
      ? `${user.name.substring(0, 12)}...`
      : user.name
    : "User"

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <div className="grid grid-cols-3 gap-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground"></div>
                </div>
                <span className="text-base font-semibold">Live Kit</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <WorkspaceSelector />
      </SidebarHeader>
      <SidebarContent>
        {isSettingsMode ? (
          <>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={() => router.push("/dashboard")}
                >
                  <Link href="/dashboard">
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span>GO BACK</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </>
        ) : (
          <>
            <NavSection label="BUILD" items={data.build} />
            <NavSection label="DEPLOY" items={data.deploy} />
            <NavSection label="MONITOR" items={data.monitor} />
            <NavSection label="SYSTEM" items={data.system} />

            <SidebarMenu className="mt-4">
              <SidebarMenuItem>
                <SidebarMenuButton className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900">
                  <LeafIcon className="h-4 w-4" />
                  <span>Free Trial</span>
                  <ChevronDownIcon className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-700 text-white text-xs font-medium">
                    {userInitial}
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                    <span className="truncate text-sm font-medium w-full">{displayName}</span>
                    {user?.email && (
                      <span className="truncate text-xs text-muted-foreground w-full">
                        {user.email.length > 20 ? `${user.email.substring(0, 17)}...` : user.email}
                      </span>
                    )}
                  </div>
                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <div className="flex items-center gap-2 p-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-700 text-white text-xs font-medium">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    {user?.email && (
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <span>Logout</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <a href="#" className="hover:underline flex items-center gap-1">
            <InfoIcon className="h-3 w-3" />
            Help
          </a>
          <Separator orientation="vertical" className="h-3" />
          <a href="#" className="hover:underline flex items-center gap-1">
            <MegaphoneIcon className="h-3 w-3" />
            Updates
          </a>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-destructive"></span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
