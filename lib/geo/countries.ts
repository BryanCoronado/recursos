export type CountryOption = {
  code: string
  name: string
  dial: string
}

/** Países priorizados LATAM + comunes. */
export const COUNTRIES: CountryOption[] = [
  { code: "PE", name: "Perú", dial: "51" },
  { code: "MX", name: "México", dial: "52" },
  { code: "CO", name: "Colombia", dial: "57" },
  { code: "AR", name: "Argentina", dial: "54" },
  { code: "CL", name: "Chile", dial: "56" },
  { code: "EC", name: "Ecuador", dial: "593" },
  { code: "BO", name: "Bolivia", dial: "591" },
  { code: "VE", name: "Venezuela", dial: "58" },
  { code: "UY", name: "Uruguay", dial: "598" },
  { code: "PY", name: "Paraguay", dial: "595" },
  { code: "BR", name: "Brasil", dial: "55" },
  { code: "US", name: "Estados Unidos", dial: "1" },
  { code: "ES", name: "España", dial: "34" },
  { code: "GT", name: "Guatemala", dial: "502" },
  { code: "HN", name: "Honduras", dial: "504" },
  { code: "SV", name: "El Salvador", dial: "503" },
  { code: "NI", name: "Nicaragua", dial: "505" },
  { code: "CR", name: "Costa Rica", dial: "506" },
  { code: "PA", name: "Panamá", dial: "507" },
  { code: "DO", name: "Rep. Dominicana", dial: "1" },
  { code: "CU", name: "Cuba", dial: "53" },
  { code: "OTHER", name: "Otro", dial: "" },
]

export function getCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code)
}

/** Normaliza a +[dial][digits] */
export function buildE164Phone(countryCode: string, nationalNumber: string) {
  const digits = nationalNumber.replace(/\D/g, "")
  const country = getCountry(countryCode)
  if (!country) return null
  if (country.code === "OTHER") {
    if (digits.length < 8 || digits.length > 15) return null
    return `+${digits}`
  }
  const dial = country.dial
  // Si el usuario pegó el número con código país, no duplicar
  const national =
    dial && digits.startsWith(dial) && digits.length > dial.length + 6
      ? digits.slice(dial.length)
      : digits
  if (national.length < 7 || national.length > 12) return null
  return `+${dial}${national}`
}
