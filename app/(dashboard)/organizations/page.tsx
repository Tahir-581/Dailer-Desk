import { requireAuth } from "@/lib/auth/server"
import { getSession } from "@/lib/auth/server"
import { OrganizationsList } from "@/components/organizations/organizations-list"
import { CreateOrganizationButton } from "@/components/organizations/create-organization-button"

export default async function OrganizationsPage() {
  await requireAuth()
  const session = await getSession()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">
              Manage your organizations and access
            </p>
          </div>
          <CreateOrganizationButton />
        </div>
        <div className="mt-8">
          <OrganizationsList userId={session?.user?.id || ""} />
        </div>
      </div>
    </div>
  )
}
