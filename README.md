# FalconX AI — Landing Page

Sitio web de FalconX AI — automatización de comunicación con IA para empresas.

## Stack

- **Astro 5** — Static Site Generation
- **GSAP 3.12** — animaciones y scroll reveals
- CSS custom properties (sin framework)
- Canvas — animación de red neuronal en el hero

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor local en http://localhost:4321
npm run build    # build de producción → dist/
npm run preview  # previsualizar el build
```

## Estructura

```
src/
├── layouts/BaseLayout.astro   # HTML base, fonts, GSAP, aurora
├── components/                # Nav, Hero, Servicios, Canales, Casos,
│                              # Proceso, Tecnologias, Contacto, Footer
├── styles/global.css          # variables, aurora, responsive
└── pages/index.astro          # ensambla todos los componentes
```

## Despliegue

Conectado a Netlify. Cada push a `main` redespliega automáticamente.

## Pendientes

- Conectar formulario de contacto a webhook (n8n / Formspree)
- Reemplazar logo SVG por versión vectorizada profesional
