import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export async function getSession() {
  const headersList = await headers();
  return await auth.api.getSession({ headers: headersList });
}


export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  return session;
}
