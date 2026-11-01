import { requireAuth } from "@/lib/auth/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Users, Plus, Info, MoreVertical } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function UsersSettingsPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 gap-6 p-6">
      {}
      <div className="w-48 flex-shrink-0 border-r pr-6">
        <div className="flex flex-col gap-4">
          <div className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
            SELECT MENU
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href="/settings/workspace"
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md transition-colors"
            >
              <Settings className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">General</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border border-foreground/10">
              <Users className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Users</span>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <Button variant="outline" className="border-border bg-background" disabled>
            <Plus className="h-4 w-4 mr-1.5" />
            Invite a member
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {}
          <div className="flex items-center border-b pb-2">
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Email</span>
            </div>
            <div className="flex-1 flex justify-end">
              <span className="text-sm text-muted-foreground">Role</span>
            </div>
            <div className="w-12"></div>
          </div>

          {}
          <div className="flex items-center py-3 border-b">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-foreground">you@example.com</span>
              <Badge className="bg-muted text-foreground border-0 text-xs px-2 py-0.5">
                You
              </Badge>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2">
              <span className="text-sm text-foreground">Admin</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-12 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Remove</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

