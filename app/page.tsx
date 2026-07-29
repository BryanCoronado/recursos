import { redirect } from "next/navigation"

import { resolveHomePath } from "@/lib/auth/home-path"
import { requireUser } from "@/lib/auth/authorization"

export default async function HomePage() {
  const user = await requireUser()
  redirect(resolveHomePath(user.permissions))
}
