# Binding Identity · Documentación

Portal estático de consulta: **21 artículos, 15 apartados principales y seis hijos del último**. Incluye directorio general, menú lateral, migas y anterior/siguiente. La cabecera mantiene el logo identificativo y un enlace «Documentación» al índice; no hay footer. No incorpora backend ni servicios empresariales.

Tecnologías: Astro **7.4.2**, TypeScript estricto, Content Collections/Markdown, CSS propio y JavaScript nativo. Logo y fuentes Inter/Montserrat locales. Pruebas con Playwright y axe-core. Las versiones exactas están fijadas en `package.json` y `package-lock.json`.

## Instalar y ejecutar

Entorno comprobado: Windows, **Node 24.11.1** (`.nvmrc`) y **npm 11.6.2**. Usar esa versión de Node para reproducir la entrega. Se necesita acceso al registro npm para una instalación nueva.

```sh
npm ci
npm run dev
```

Abrir la URL que imprime Astro, normalmente `http://127.0.0.1:4321/`. Para revisar la compilación estática:

```sh
npm run build
npm run preview
```

## Validar

```sh
npm run check
npm run lint
npm run test:contrast
npm run build
npm test
npm run test:base
```

Ejecutar ambas suites **en serie**, con 4321 y 4322 libres de servidores ajenos. Desde esta carpeta, `npm exec astro -- preview stop` detiene un preview persistente de este proyecto antes de probar. Los tests principales usan `dist/`; el caso `/documentacion/` compila aparte en `.base-check/dist/`. Informes y capturas se generan en `verification/`.

En local se utiliza Chrome instalado. Como alternativa, ejecutar `npx playwright install chromium` y definir `PLAYWRIGHT_CHANNEL=chromium` en el entorno de la consola. El workflow de CI instala Chromium y sus dependencias para Ubuntu 24.04, usa `.nvmrc` y ejecuta la misma validación. El resultado y los logs de cada commit se consultan en [GitHub Actions](https://github.com/davznar41/binding-identity-docs/actions); solo una ejecución completa satisfactoria acredita sus comprobaciones automatizadas. No se requieren credenciales del producto. Puede definirse `ASTRO_TELEMETRY_DISABLED=1` para desactivar telemetría en la sesión.

Resultado local del **30 de octubre de 2026**, tras instalación limpia con `npm ci`: check y lint satisfactorios; 23 páginas compiladas; **64 pruebas principales y tres de prefijo superadas**; 26 análisis axe sin infracciones detectadas; 32 parejas de contraste y 48 escenarios renderizados satisfactorios. No equivale a conformidad completa. [Alcance y pendientes de accesibilidad](docs/ACCESIBILIDAD.md).

## Arquitectura y mantenimiento

| Ubicación | Responsabilidad |
|---|---|
| `src/content/docs/` | 21 Markdown: ID, título, cuerpo y ejemplo opcional |
| `src/content.config.ts` | Esquema y carga de la colección |
| `src/data/navigation.ts` | IDs, orden 15+6 y relaciones; títulos tomados de la colección |
| `src/components/`, `src/layouts/` | Cabecera, navegación, migas, paginación y HTML común |
| `src/pages/` | Directorio, artículos estáticos y 404 |
| `src/lib/paths.ts` | Prefijo compartido de rutas |
| `src/styles/`, `public/assets/` | Estilos, tokens, logo, cinco WOFF2 y dos licencias OFL |
| `tests/`, `scripts/` | Contrato editorial, integridad, navegador, contraste y prefijo |
| `docs/`, `.github/workflows/` | Accesibilidad, matriz y workflow de CI |

El `id` del frontmatter determina `/docs/<id>/`; renombrar un archivo conservando su ID no cambia la URL. El título alimenta H1, menú y migas; el primer párrafo alimenta los metadatos HTML. El cuerpo admite Markdown con encabezados desde H2; cada página ya tiene su H1. `example` solo se muestra cuando existe.

Los textos empresariales requieren aprobación antes de editarse. Una ampliación autorizada exige actualizar IDs/jerarquía, colección, fixture editorial y pruebas. La compilación comprueba que la colección coincida con el contrato. Los hashes de tests normalizan exclusivamente CRLF a LF al comparar; actualizar un hash no sustituye una aprobación editorial.

Para alojar bajo un prefijo, establecer `DOCS_BASE=/documentacion/` **tanto al compilar como al servir el preview**. En raíz no hace falta. `DOCS_OUT_DIR` permite aislar la salida; `test:base` gestiona ambas variables automáticamente sin alterar `dist/`. El alojamiento definitivo deberá servir el resultado en el prefijo elegido y configurar su respuesta 404.

## Iconos propios

El registro opcional `src/data/icons.ts` está vacío y usa IDs estables. Sin recurso no hay imagen ni espacio reservado. Los SVG aprobados se incorporan en `src/assets/icons/`; el helper puro está separado del registro de Vite. Seguir la [guía de incorporación y revisión de SVG](src/assets/icons/README.md). No se necesitan 21 iconos: están previstos inicialmente los 15 principales.

## Inventario y entrega

- **Candidato para GitHub:** fuente, 21 artículos, recursos, dos licencias de fuentes, tests/fixtures, scripts, configuraciones y CI; este README, [resumen de accesibilidad](docs/ACCESIBILIDAD.md), [matriz íntegra de 86 criterios](docs/matriz-wcag22.json) y guía SVG.
- **Evidencias separadas:** resultados finales, capturas, manifiestos de integridad e informes históricos. No se incorporan al repositorio.
- Se excluyen dependencias, compilados, cachés, informes, históricos, `.env*`, logs y ZIP mediante `.gitignore`. Las fixtures y la matriz necesarias para revisar y probar sí están incluidas.

Pendientes: pruebas manuales/tecnologías de apoyo, SVG definitivos, definiciones y abreviaturas aprobadas, revisión de CI en cada cambio, alojamiento y revisión empresarial de contenido, derechos y ámbito normativo. No se añade licencia general. Las licencias OFL están en `public/assets/fonts/`. La integración en un repositorio corporativo requiere las instrucciones de Binding Software. Esta entrega no incluye despliegue web.
