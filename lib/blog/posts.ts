import {
  FREE_DOWNLOAD_LIMIT,
  MONTHLY_PRICE_SOLES,
  MONTHLY_PRICE_USD,
} from "@/lib/billing/plans"

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }

export type BlogPost = {
  slug: string
  title: string
  description: string
  excerpt: string
  date: string
  category: string
  keywords: string[]
  readingMinutes: number
  related: string[]
  blocks: BlogBlock[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "que-es-envato-elements",
    title: "Qué es Envato Elements y para qué sirve",
    description:
      "Envato Elements es una biblioteca de plantillas, gráficos, música y vídeo. Te explicamos qué incluye, quién lo usa y cómo descargarlo en Perú con MICHITECH.",
    excerpt:
      "Plantillas, mockups, música y stock en un solo catálogo. Si diseñas o editas, Envato Elements es de lo más pedido — y en MICHITECH lo bajas desde su propio panel.",
    date: "2026-07-22",
    category: "Envato",
    keywords: [
      "qué es Envato Elements",
      "Envato Elements qué incluye",
      "plantillas Envato",
      "stock Envato Perú",
    ],
    readingMinutes: 7,
    related: [
      "como-descargar-envato-elements-en-peru",
      "cuanto-cuesta-envato-elements",
      "envato-elements-vs-magnific",
    ],
    blocks: [
      {
        type: "p",
        text: "Envato Elements es una biblioteca de recursos digitales: plantillas para web y presentaciones, gráficos, fotos, música, efectos de sonido y vídeo. Lo usan diseñadores, editores, agencias y marketers que necesitan material listo para producir, no para inventar todo desde cero.",
      },
      {
        type: "p",
        text: "No es un banco de una sola categoría. El valor está en mezclar: un pack de UI, una pista de audio y un mockup en la misma sesión de trabajo. Por eso aparece tanto en búsquedas como **descargar Envato Elements** o **membresía Envato barata**.",
      },
      {
        type: "h2",
        text: "Qué puedes encontrar en Envato Elements",
      },
      {
        type: "ul",
        items: [
          "Plantillas WordPress, HTML, Figma y presentaciones (Keynote, PowerPoint, Google Slides).",
          "Gráficos: iconos, ilustraciones, fondos y mockups.",
          "Foto y vídeo stock para anuncios, reels y sitios.",
          "Música y SFX para editar sin pelearte con licencias sueltas.",
          "Add-ons para After Effects, Premiere y herramientas de diseño.",
        ],
      },
      {
        type: "h2",
        text: "¿Para quién tiene sentido?",
      },
      {
        type: "p",
        text: "Si entregas piezas cada semana —branding, landing, video corto, anuncio— Envato te ahorra horas. Un freelancer en Lima o un estudio en Bogotá suele necesitar el mismo tipo de archivo: un ZIP con fuentes, preview y capas. El cuello de botella no es “encontrar inspiración”; es **bajar el archivo y seguir**.",
      },
      {
        type: "quote",
        text: "En MICHITECH, Envato vive en su propio panel. Magnific no se mezcla: otro historial, otro cupo, otro tutorial.",
      },
      {
        type: "h2",
        text: "Cómo se descarga en la práctica",
      },
      {
        type: "p",
        text: "En el sitio de Envato Elements abres el recurso, copias la URL y la pegas en el panel Envato de MICHITECH. Ves el progreso en vivo y, cuando termina, recoges el ZIP desde el historial. Hay un tutorial en video en la landing si es la primera vez.",
      },
      {
        type: "p",
        text: `Empiezas con ${FREE_DOWNLOAD_LIMIT} descargas gratis para probar el flujo. Si te sirve, la membresía ilimitada parte de S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD al mes, con activación por WhatsApp el mismo día.`,
      },
      {
        type: "h2",
        text: "Envato Elements no es Magnific",
      },
      {
        type: "p",
        text: "Se parecen en que ambos son proveedores de recursos, pero no son el mismo producto ni el mismo panel. Si necesitas los dos, en MICHITECH se asignan los dos roles: Clientes Envato y Clientes Magnific. Cada uno ve solo lo suyo.",
      },
    ],
  },
  {
    slug: "que-es-magnific",
    title: "Qué es Magnific y cuándo usarlo",
    description:
      "Magnific es un proveedor de recursos creativos distinto a Envato. Aprende qué es, cómo se descarga y por qué en MICHITECH tiene panel, historial y cupo propios.",
    excerpt:
      "Magnific no es un “extra” de Envato: es otro catálogo, otro flujo y otro historial. Te contamos qué es y cómo bajarlo sin mezclarlo.",
    date: "2026-07-28",
    category: "Magnific",
    keywords: [
      "qué es Magnific",
      "Magnific AI",
      "descargar Magnific",
      "Magnific Perú",
    ],
    readingMinutes: 6,
    related: [
      "envato-elements-vs-magnific",
      "tutorial-michitech-pegar-enlace",
      "que-es-envato-elements",
    ],
    blocks: [
      {
        type: "p",
        text: "Magnific es un proveedor de recursos creativos. En MICHITECH lo tratamos como un producto aparte: no comparte panel con Envato, no comparte historial y no comparte el cupo de prueba. Si tu rol es Clientes Magnific, ves Magnific. Si también tienes Envato, ves los dos módulos, cada uno en su sitio.",
      },
      {
        type: "h2",
        text: "Por qué va en un panel distinto",
      },
      {
        type: "p",
        text: "Mezclar proveedores en la misma cola genera errores tontos: pegar un link de Magnific en Envato, perder un archivo en el historial equivocado, o gastar el cupo gratis del otro lado. Por eso el diseño es deliberado: **un dominio, dos paneles**.",
      },
      {
        type: "ul",
        items: [
          "URL de magnific.com → panel Magnific.",
          "Progreso y ZIP quedan en el historial de Magnific.",
          "El tutorial de la landing es el de Magnific, no el de Envato.",
          `${FREE_DOWNLOAD_LIMIT} descargas gratis propias, independientes de Envato.`,
        ],
      },
      {
        type: "h2",
        text: "Cómo descargar Magnific con MICHITECH",
      },
      {
        type: "p",
        text: "Abres magnific.com, copias el enlace completo del recurso, lo pegas en MICHITECH → Magnific y pulsas Descargar recurso. Cuando el estado pasa a Completada, bajas el archivo desde el historial. El mismo patrón que Envato, sin cruzar cables.",
      },
      {
        type: "quote",
        text: "Si te trabas en el primer intento, WhatsApp. El soporte no te manda a un ticket: te responde en el mismo hilo.",
      },
      {
        type: "h2",
        text: "¿Envato o Magnific?",
      },
      {
        type: "p",
        text: "Depende de lo que estés produciendo. Muchos clientes empiezan por Envato (plantillas y stock) y suman Magnific cuando el brief lo pide. No hace falta adivinar: pruebas ambos con el cupo gratis y activas la membresía del que uses — o de los dos.",
      },
    ],
  },
  {
    slug: "como-descargar-envato-elements-en-peru",
    title: "Cómo descargar Envato Elements en Perú (paso a paso)",
    description:
      "Guía para descargar Envato Elements online en Perú: copiar la URL, pegarla en MICHITECH, ver el progreso y bajar el ZIP. 2 descargas gratis. Desde S/ 15 o $5 USD al mes.",
    excerpt:
      "No necesitas VPN rara ni adivinar el flujo. Cuatro pasos: busca, copia, pega, descarga. Pensado para Perú y el resto de Latam.",
    date: "2026-08-04",
    category: "Tutoriales",
    keywords: [
      "descargar Envato Elements Perú",
      "cómo descargar Envato Elements",
      "tutorial Envato Elements",
      "Envato Elements online",
    ],
    readingMinutes: 8,
    related: [
      "tutorial-michitech-pegar-enlace",
      "que-es-envato-elements",
      "cuanto-cuesta-envato-elements",
    ],
    blocks: [
      {
        type: "p",
        text: "Si buscas **descargar Envato Elements en Perú**, el flujo en MICHITECH es web: funciona desde Lima, Arequipa o cualquier ciudad con navegador. No instalas un cliente pesado. Creas cuenta, abres el panel Envato y pegas el link del recurso.",
      },
      {
        type: "h2",
        text: "Antes de empezar",
      },
      {
        type: "ul",
        items: [
          "Una cuenta en michitech.digital (el registro no pide tarjeta).",
          "Rol de Clientes Envato (si no lo ves, escríbenos por WhatsApp).",
          "El recurso abierto en elements.envato.com para copiar la URL completa.",
        ],
      },
      {
        type: "h2",
        text: "Paso 1 — Busca el recurso",
      },
      {
        type: "p",
        text: "Entra a Envato Elements y abre la página del producto (plantilla, gráfico, pista o vídeo). Quédate en esa URL: es la que el panel necesita, no un enlace acortado ni un preview suelto.",
      },
      {
        type: "h2",
        text: "Paso 2 — Copia el enlace",
      },
      {
        type: "p",
        text: "Copia la dirección completa de la barra del navegador. Si el pegado falla, casi siempre es porque faltó un trozo de la URL o se pegó un link de búsqueda en lugar del producto.",
      },
      {
        type: "h2",
        text: "Paso 3 — Pégalo en el panel Envato",
      },
      {
        type: "p",
        text: "En MICHITECH ve a Envato (no a Magnific). Pega el enlace y pulsa Descargar recurso. El progreso se ve en vivo: no tienes que adivinar si “está pensando” o si ya terminó.",
      },
      {
        type: "h2",
        text: "Paso 4 — Recoge el ZIP",
      },
      {
        type: "p",
        text: "Cuando el estado diga Completada, descarga el archivo desde el historial de Envato. Si falla, abre el log de esa descarga: suele indicar si el link era incorrecto o si hay que reintentar.",
      },
      {
        type: "quote",
        text: `Las primeras ${FREE_DOWNLOAD_LIMIT} descargas son gratis por proveedor. Sirven para validar que el flujo te encaja antes de pedir la membresía por WhatsApp.`,
      },
      {
        type: "h2",
        text: "Precios si te quedas",
      },
      {
        type: "p",
        text: `Membresía desde S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD al mes. Pack 3 meses: S/ 40 / $12 USD. Pack 1 año: S/ 135 / $40 USD. Incluye 1 dispositivo; extra +S/ 10 / $3 USD al mes. Pagas en soles o dólares y lo activamos el mismo día.`,
      },
    ],
  },
  {
    slug: "envato-elements-vs-magnific",
    title: "Envato Elements vs Magnific: diferencias y cuál elegir",
    description:
      "Compara Envato Elements y Magnific: catálogo, panel, historial y cupo. En MICHITECH no se mezclan. Elige uno o ambos según lo que produzcas.",
    excerpt:
      "No son el mismo servicio. Te dejamos una comparación clara para no pegar el link en el panel equivocado ni gastar el cupo del otro.",
    date: "2026-08-08",
    category: "Guías",
    keywords: [
      "Envato vs Magnific",
      "diferencia Envato Magnific",
      "panel Envato",
      "panel Magnific",
    ],
    readingMinutes: 6,
    related: [
      "que-es-envato-elements",
      "que-es-magnific",
      "como-descargar-envato-elements-en-peru",
    ],
    blocks: [
      {
        type: "p",
        text: "La pregunta más frecuente en WhatsApp no es el precio: es **si Envato y Magnific son lo mismo**. No. Son proveedores distintos. En MICHITECH tienen roles distintos (Clientes Envato / Clientes Magnific), paneles distintos y cupos de prueba distintos.",
      },
      {
        type: "h2",
        text: "Tabla mental (sin mezclar)",
      },
      {
        type: "ul",
        items: [
          "Envato Elements: plantillas, gráficos, música, vídeo y stock clásico. URL de elements.envato.com → panel Envato.",
          "Magnific: otro catálogo y otro flujo. URL de magnific.com → panel Magnific.",
          "Historial: cada descarga queda en el proveedor donde la lanzaste.",
          "Tutorial: el video de Envato no aplica a Magnific, y al revés.",
        ],
      },
      {
        type: "h2",
        text: "Cuál te conviene primero",
      },
      {
        type: "p",
        text: "Si vives de landings, presentaciones y packs de marca, empieza por Envato. Si el brief te pide Magnific de forma recurrente, abre ese panel y usa su cupo gratis. Muchos equipos terminan con ambos roles porque los clientes piden de los dos mundos.",
      },
      {
        type: "h2",
        text: "Un error que conviene evitar",
      },
      {
        type: "p",
        text: "Pegar un link de Magnific en el panel Envato (o al revés) no “se adapta solo”. Elige el módulo correcto. La landing tiene un tutorial por proveedor precisamente para eso: el paso a paso cambia de sitio, no de lógica.",
      },
      {
        type: "quote",
        text: "Un dominio. Dos paneles. Esa separación es el producto, no un detalle de diseño.",
      },
    ],
  },
  {
    slug: "cuanto-cuesta-envato-elements",
    title: "Cuánto cuesta Envato Elements y qué alternativa hay en Perú",
    description:
      "La membresía oficial de Envato Elements suele superar los 16 USD al mes. En MICHITECH descargas desde S/ 15 o $5 USD, con 2 pruebas gratis y pago por WhatsApp en soles o dólares.",
    excerpt:
      "Si el precio oficial se te va del presupuesto, compara números: prueba gratis, planes en PEN y USD, y activación el mismo día.",
    date: "2026-08-12",
    category: "Precios",
    keywords: [
      "precio Envato Elements",
      "Envato Elements barato",
      "alternativa Envato Elements",
      "membresía Envato Perú",
      "Envato Elements USD",
    ],
    readingMinutes: 7,
    related: [
      "como-descargar-envato-elements-en-peru",
      "tutorial-michitech-pegar-enlace",
      "que-es-envato-elements",
    ],
    blocks: [
      {
        type: "p",
        text: "La membresía individual de Envato Elements, en el sitio oficial, suele costar más de **16 USD al mes** si pagas anual, y bastante más si pagas mes a mes. Para un freelancer en Perú eso se siente: tipo de cambio, tarjeta internacional y un gasto fijo aunque el mes venga flojo.",
      },
      {
        type: "h2",
        text: "Qué ofrece MICHITECH en números",
      },
      {
        type: "ul",
        items: [
          `Prueba: ${FREE_DOWNLOAD_LIMIT} descargas gratis por proveedor, sin tarjeta.`,
          `1 mes: S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD.`,
          "3 meses: S/ 40 o $12 USD (el más pedido).",
          "1 año: S/ 135 o $40 USD.",
          "1 dispositivo incluido; extra +S/ 10 / $3 USD al mes.",
        ],
      },
      {
        type: "p",
        text: "Pagas en soles o dólares por WhatsApp. No hay pasarela que te deje colgado a media noche: coordinas, se activa el plan y entras al panel.",
      },
      {
        type: "h2",
        text: "No es solo “más barato”",
      },
      {
        type: "p",
        text: "El ahorro importa, pero la gente se queda por el flujo: progreso en vivo, historial, tutorial en español y paneles que no mezclan Envato con Magnific. Si ya pagaste una membresía oficial y te rinde, perfecto. Si necesitas bajar recursos con un costo predecible en PEN o USD, este es el hueco que cubrimos.",
      },
      {
        type: "quote",
        text: "Empieza gratis. Si el ZIP sale bien la primera vez, el plan de 3 meses suele ser el que más piden.",
      },
      {
        type: "h2",
        text: "Cómo activar",
      },
      {
        type: "p",
        text: "Crea la cuenta, prueba las descargas gratis y escribe por WhatsApp el plan (1 mes, 3 meses o 1 año) y si es Envato, Magnific o ambos. Lo dejamos listo el mismo día.",
      },
    ],
  },
  {
    slug: "tutorial-michitech-pegar-enlace",
    title: "Tutorial MICHITECH: pegar el enlace y descargar el ZIP",
    description:
      "Cómo usar el panel MICHITECH: pegar la URL de Envato o Magnific, seguir el progreso en vivo y descargar el archivo desde el historial. Incluye errores frecuentes.",
    excerpt:
      "El truco no es mágico: es pegar la URL correcta en el panel correcto. Aquí el flujo y lo que suele fallar la primera vez.",
    date: "2026-08-16",
    category: "Tutoriales",
    keywords: [
      "tutorial MICHITECH",
      "cómo usar MICHITECH",
      "pegar enlace Envato",
      "historial descargas",
    ],
    readingMinutes: 6,
    related: [
      "como-descargar-envato-elements-en-peru",
      "que-es-magnific",
      "cuanto-cuesta-envato-elements",
    ],
    blocks: [
      {
        type: "p",
        text: "MICHITECH no te pide cazar un botón escondido en el proveedor. El producto es simple: **copias la URL del recurso, la pegas en su panel y esperas el ZIP**. Envato y Magnific usan el mismo gesto, en módulos distintos.",
      },
      {
        type: "h2",
        text: "El flujo en 30 segundos",
      },
      {
        type: "ul",
        items: [
          "Entra a Envato o a Magnific, según el archivo.",
          "Abre el producto y copia la URL completa.",
          "En michitech.digital abre el panel de ese proveedor.",
          "Pega, descarga, mira la barra, recoge el archivo en el historial.",
        ],
      },
      {
        type: "h2",
        text: "Errores frecuentes (y cómo evitarlos)",
      },
      {
        type: "ul",
        items: [
          "Pegar un link de Magnific en Envato, o al revés. Elige el módulo primero.",
          "Copiar la URL de una búsqueda o de un preview, no la del producto.",
          "Salir de la página antes de que el estado pase a Completada: el historial guarda el trabajo, pero conviene esperar el OK.",
          "Gastar el cupo gratis en pruebas con URLs a medias. Usa un recurso real que sí vayas a abrir.",
        ],
      },
      {
        type: "h2",
        text: "Dispositivos",
      },
      {
        type: "p",
        text: "Cada plan incluye 1 dispositivo. Si cambias de laptop o necesitas otro equipo, se amplía por WhatsApp (+S/ 10 / $3 USD al mes). No es un castigo: es para que la cuenta no se preste en diez sitios a la vez.",
      },
      {
        type: "quote",
        text: "Hay tutorial en video para Envato en la landing. Magnific lleva los mismos pasos, en su propio bloque.",
      },
      {
        type: "h2",
        text: "Cuando ya te convenció",
      },
      {
        type: "p",
        text: `Pide el plan por WhatsApp. Desde S/ ${MONTHLY_PRICE_SOLES} o $${MONTHLY_PRICE_USD} USD al mes. Si aún no pruebas, crea la cuenta: ${FREE_DOWNLOAD_LIMIT} descargas gratis por proveedor alcanzan para ver si el ZIP llega limpio.`,
      },
    ],
  },
]

export function getAllPosts() {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null
}

export function getRelatedPosts(post: BlogPost) {
  return post.related
    .map((slug) => getPost(slug))
    .filter((item): item is BlogPost => Boolean(item))
}
