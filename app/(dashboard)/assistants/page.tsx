import { requireAuth } from "@/lib/auth/server"
import { AssistantsTable } from "@/components/assistants/assistants-table"

export default async function AssistantsPage() {
  await requireAuth()
  
  return <AssistantsTable />
}
