import { requireAuth } from "@/lib/auth/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PowerIcon, PlusIcon, MoreVerticalIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ApiKeysSettingsPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <Button className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Add Key
        </Button>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none gap-0">
          <TabsTrigger
            value="api-keys"
            className="px-0 py-2 mr-6 text-sm font-medium text-foreground data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none data-[state=active]:bg-transparent"
          >
            API Keys
          </TabsTrigger>
          <TabsTrigger
            value="public-keys"
            className="px-0 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none data-[state=active]:bg-transparent"
          >
            Public Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="text-sm font-medium text-foreground">
                  Name
                </TableHead>
                <TableHead className="text-sm font-medium text-foreground text-center">
                  Key Value
                </TableHead>
                <TableHead className="text-sm font-medium text-foreground text-right">
                  Created at
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b">
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <PowerIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Secret Key</span>
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs px-2 py-0.5">
                      Webhook
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center py-4">
                  <span className="text-sm text-foreground font-mono">
                    key_••••••••••••••••
                  </span>
                </TableCell>
                <TableCell className="text-right py-4">
                  <span className="text-sm text-foreground">11/03/2025, 16:59</span>
                </TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVerticalIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="public-keys" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                <TableHead className="text-sm font-medium text-foreground">
                  Name
                </TableHead>
                <TableHead className="text-sm font-medium text-foreground text-center">
                  Key Value
                </TableHead>
                <TableHead className="text-sm font-medium text-foreground text-right">
                  Created at
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                  No public keys found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
