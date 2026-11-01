import { requireAuth } from "@/lib/auth/server"
import { getSession } from "@/lib/auth/server"
import { db, orgs } from "@/lib/db"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Users } from "lucide-react"
import Link from "next/link"

export default async function WorkspaceSettingsPage() {
  await requireAuth()
  
  

  const currentOrgId = cookies().get("current_org_id")?.value
  
  let currentOrg = null
  if (currentOrgId) {
    const orgsList = await db
      .select()
      .from(orgs)
      .where(eq(orgs.id, currentOrgId))
      .limit(1)
    
    if (orgsList.length > 0) {
      currentOrg = orgsList[0]
    }
  }

  return (
    <div className="flex flex-1 gap-6 p-6">
      {}
      <div className="w-48 flex-shrink-0 border-r pr-6">
        <div className="flex flex-col gap-4">
          <div className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
            SELECT MENU
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border border-foreground/10">
              <Settings className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">General</span>
            </div>
            <Link
              href="/settings/users"
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md transition-colors"
            >
              <Users className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Users</span>
            </Link>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Workspace</h1>
        </div>

        <div className="flex flex-col gap-6 w-full flex-1">
          {}
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
              Workspace Name
            </Label>
            <Input
              id="workspace-name"
              name="workspace-name"
              defaultValue={currentOrg?.name || "usman zafar's"}
              className="max-w-md"
              disabled
            />
          </div>

          {}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">
              Workspace ID
            </Label>
            <div className="text-sm text-foreground font-mono">
              {currentOrg?.id || "org_wtfphWgOFNfRuYUh"}
            </div>
          </div>

          {}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled
            >
              Delete
            </Button>
            <Button className="bg-black text-white hover:bg-black/90">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
