"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Organization {
  id: string
  orgId: string
  role: "owner" | "admin" | "member"
  org: {
    id: string
    name: string
    slug: string
  }
  createdAt?: string
}

interface OrganizationsListProps {
  userId: string
}

export function OrganizationsList({ userId }: OrganizationsListProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiClient.get("/api/orgs/memberships")
        setOrganizations(response.data)
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchOrganizations()
    }
  }, [userId])

  const handleSwitchOrg = async (orgId: string) => {
    try {
      await apiClient.post("/api/orgs/switch", { orgId })
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error switching organization:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organizations</CardTitle>
          <CardDescription>
            You haven&apos;t joined any organizations yet. Create one to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {organizations.map((membership) => (
        <Card key={membership.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{membership.org.name}</CardTitle>
                <CardDescription className="mt-1">{membership.org.slug}</CardDescription>
              </div>
              <Badge variant={membership.role === "owner" ? "default" : membership.role === "admin" ? "secondary" : "outline"}>
                {membership.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {membership.createdAt && (
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(membership.createdAt).toLocaleDateString()}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSwitchOrg(membership.orgId)}
              >
                Switch
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
