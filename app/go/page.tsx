import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth/authorization"
import { resolveHomePath } from "@/lib/auth/home-path"

/** Entrada a la app tras login (no es la landing). */
export default async function GoPage() {
  const user = await requireUser()
  redirect(resolveHomePath(user.permissions))
}
