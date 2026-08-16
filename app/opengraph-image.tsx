import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt =
  "MICHITECH — Descargar Envato Elements y Magnific online en Perú"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public", "logo-sinfondo-michitech.png")
  )
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #050910 0%, #101826 45%, #162033 100%)",
          color: "#eaf0f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img
            src={logoSrc}
            width={112}
            height={112}
            alt=""
            style={{ borderRadius: 28 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 8,
                textTransform: "uppercase",
                color: "#8bbcff",
                fontWeight: 700,
              }}
            >
              MICHITECH
            </div>
            <div style={{ fontSize: 28, color: "#95a6bf", marginTop: 6 }}>
              michitech.digital
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            Descarga Envato Elements y Magnific online
          </div>
          <div style={{ fontSize: 28, color: "#95a6bf", maxWidth: 900 }}>
            Paneles separados · tutorial · historial en vivo · desde S/ 20 o $6
            USD / mes
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
