import {
  Clapperboard,
  Megaphone,
  Palette,
  Users,
} from "lucide-react"

import { LandingReveal } from "@/components/marketing/landing-reveal"

const AUDIENCE = [
  {
    icon: Palette,
    title: "Diseñadores y UI",
    body: "Plantillas, mockups e iconos sin armar un kit desde cero cada brief.",
  },
  {
    icon: Clapperboard,
    title: "Editores de video",
    body: "Música, SFX y stock para reels, ads y piezas de cliente, con el ZIP a mano.",
  },
  {
    icon: Users,
    title: "Agencias y estudios",
    body: "Un panel por proveedor, historial claro y 1 dispositivo incluido por plan.",
  },
  {
    icon: Megaphone,
    title: "Marketing y social",
    body: "Creatividades listas cuando el calendario no espera a la membresía oficial.",
  },
] as const

export function LandingAudience() {
  return (
    <section
      id="para-quien"
      className="scroll-mt-24 py-16 sm:py-24"
      aria-labelledby="para-quien-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <p className="text-[13px] font-medium text-[var(--mich-blue-bright)]">
            Para quién
          </p>
          <h2
            id="para-quien-title"
            className="font-heading mt-2 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          >
            Hecho para quien produce, no para quien colecciona membresías.
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--mich-muted)]">
            Si entregas piezas cada semana, el cuello de botella es bajar el
            archivo y seguir. Envato y Magnific, cada uno en su módulo.
          </p>
        </LandingReveal>

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {AUDIENCE.map((item, i) => (
            <LandingReveal key={item.title} delay={i * 70} variant="scale">
              <article className="mich-soft-card mich-hover-card h-full p-5">
                <item.icon className="size-5 text-[var(--mich-blue)]" />
                <h3 className="font-heading mt-3 text-base font-semibold tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--mich-muted)]">
                  {item.body}
                </p>
              </article>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
