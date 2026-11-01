import { requireAuth } from "@/lib/auth/server"
import { PhoneNumbersList } from "@/components/phone-numbers/phone-numbers-list"

export default async function NumbersPage() {
  await requireAuth()
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Phone Numbers</h1>
          <p className="text-muted-foreground">
            Manage your phone numbers. Buy a new LiveKit number or connect your existing number via SIP trunking (e.g. Twilio).
          </p>
        </div>
        <div className="mt-8">
          <PhoneNumbersList />
        </div>
      </div>
    </div>
  )
}
