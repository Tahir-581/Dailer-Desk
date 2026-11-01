"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Organization {
  id: string
  orgId: string
  role: "owner" | "admin" | "member"
  org: {
    id: string
    name: string
    slug: string
  }
}

export function WorkspaceSelector() {
  const router = useRouter()
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [allOrgs, setAllOrgs] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const currentResponse = await apiClient.get("/api/orgs/current")
        setCurrentOrg(currentResponse.data)

        const allResponse = await apiClient.get("/api/orgs/memberships")
        setAllOrgs(allResponse.data)
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const handleSwitchOrg = async (orgId: string) => {
    try {
      await apiClient.post("/api/orgs/switch", { orgId })

      const currentResponse = await apiClient.get("/api/orgs/current")
      setCurrentOrg(currentResponse.data)
      router.refresh()
    } catch (error) {
      console.error("Error switching organization:", error)
    }
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-md bg-muted"></div>
              <span className="flex-1 truncate text-left">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!currentOrg) {
    return null
  }

  const displayName = currentOrg.org.name.length > 20
    ? `${currentOrg.org.name.substring(0, 17)}...`
    : currentOrg.org.name

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-medium">
                  {currentOrg.org.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-left">
                  {displayName}
                </span>
                <ChevronDownIcon className="ml-auto h-4 w-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          >
            {allOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrg(org.orgId)}
                className={`flex items-center gap-2 ${
                  org.orgId === currentOrg.orgId ? "bg-accent" : ""
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-medium">
                  {org.org.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col">
                  <span>{org.org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.role}</span>
                </div>
                {org.orgId === currentOrg.orgId && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
