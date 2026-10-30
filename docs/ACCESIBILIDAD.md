# Accesibilidad: resumen técnico

Evaluación local del **30 de octubre de 2026**, tras instalación limpia, sobre portada, 21 artículos, 404, menú y sus estados. Alcance: el portal documental; no acredita la accesibilidad de los productos o servicios descritos. **No se declara conformidad completa WCAG, UNE ni certificación.**

## Referencias y anexo

- UNE-EN 301549:2020 aportada como referencia técnica; corresponde a EN 301 549 V3.1.1. La copia normativa no se redistribuye con el código.
- EN 301 549 V3.2.1: requisitos web y documentación pertinente del capítulo 12.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): evaluación A/AA y objetivos AAA adicionales. El criterio 4.1.1 retirado de WCAG 2.2 permanece pertinente al revisar ediciones anteriores; su comprobación exhaustiva sigue pendiente.
- El anexo conserva también referencias técnicas a [EN V4.1.1](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/04.01.01_60/en_301549v040101p.pdf). No se deduce de su publicación una cita legal aplicable: la empresa debe confirmar norma, versión y ámbito antes de una declaración formal.

La [matriz de 86 criterios](matriz-wcag22.json) se conserva **íntegra, sin cambios de bytes**. Documenta aplicabilidad, implementación, procedimiento, evidencia y límites. Inventario: **40 Verificado, 38 No aplicable, seis Pendiente y dos No conforme** al objetivo editorial AAA. «Verificado» se limita al procedimiento descrito y no equivale a conformidad global. Los informes de ejecución se regeneran con las pruebas; los históricos se entregan fuera del código.

## Implementación que se conserva

- HTML nativo, idioma español, landmarks, listas y títulos específicos. Una única navegación 15+6, directorio como segunda vía y migas en artículos.
- Primer Tab al salto de contenido; el siguiente alcanza «Documentación». El enlace de cabecera es nativo, apunta al índice respetando el prefijo, no tiene subrayado permanente y lo muestra en hover, focus-visible y active. Conserva contexto de cabecera, tipografía diferenciada y separación del logo; no se presenta como enlace dentro de prosa. El logo es identificativo y no enlazado.
- Foco sólido de 3px y objetivos mínimos de 44px ensayados. El enlace de cabecera se activa con Enter. No se altera el subrayado de enlaces Markdown.
- Menú móvil no modal, botón del grupo independiente, `aria-expanded`, `aria-controls` y página actual en el menú. Escape restaura el foco; sin JavaScript todos los destinos siguen disponibles.
- Portada responsive, títulos completos y orden de lectura/tabulación conservado. No hay footer; migas y anterior/siguiente permanecen. Los artículos breves conservan altura natural.
- Tokens de contraste, fuentes locales y preferencias emuladas de movimiento reducido/forced-colors. Iconos opcionales decorativos con alternativa vacía; sin icono no se emite nodo ni hueco.

## Evaluación ejecutada

| Comprobación | Resultado y alcance |
|---|---|
| TypeScript / ESLint / build | Satisfactorios; 27 archivos comprobados y 23 páginas compiladas |
| Playwright | 64 pruebas principales y tres de `/documentacion/`, sin fallos, omisiones ni inestabilidad |
| axe-core | 26 análisis sin infracciones detectadas; incompletos conservados en las anotaciones |
| Contraste estático | 32 parejas de tokens satisfactorias |
| Contraste renderizado | 48 escenarios de ruta, anchura y estado; incluye cabecera normal, hover y foco |
| Navegación e integridad | Orden, rutas, títulos, ejemplos, 15+6, retorno al índice, teclado, foco y funcionamiento sin JS |
| Reflujo y preferencias | Ocho anchuras, texto CSS al 200%, espaciado, forced-colors y movimiento reducido emulados |

El ZIP de evidencias incluye `verification/results.json`, `base-results.json`, `contraste.json`, `contraste-renderizado.json` y capturas. La ausencia de infracciones axe no prueba todos los criterios; los colores calculados complementan contraste y los tests de teclado complementan la inspección del DOM. Las observaciones guiadas históricas no se presentan como una sesión humana completa nueva.

## Limitaciones que impiden cerrar la evaluación

| Pendiente | Verificación necesaria |
|---|---|
| Zoom real 200% y 400% | Ampliación nativa de navegador; CSS al 200% y viewport de 320px no la sustituyen |
| Teclado humano y lectores | Recorrido completo y anuncios con NVDA/Chrome, NVDA/Firefox y VoiceOver/Safari; compatibilidad real y lectura lineal |
| Preferencias del sistema / dispositivos | Alto contraste real, toque y orientación físicos; las emulaciones no los acreditan |
| Presentación y comprensión | Evaluación completa de preferencias visuales y nivel lector; sin inventar alternativas empresariales |
| SVG definitivos | Recursos todavía no entregados; presente se prueba con metadatos, no con un SVG corporativo renderizado |
| CI | Workflow preparado; GitHub/Linux no ejecutado ni validado |

Los seis criterios abiertos del anexo son **1.3.6, 1.4.4, 1.4.8, 1.4.10, 3.1.5 y 4.1.2**. Los objetivos AAA **3.1.3** y **3.1.4** no se satisfacen: faltan mecanismos aprobados de definición de términos especializados y expansión uniforme de abreviaturas. Se conservan los artículos originales; la empresa debe aportar ese contenido.

Para el capítulo 12, este resumen explica las funciones accesibles del portal. Faltan características aprobadas de accesibilidad/compatibilidad del producto Binding Identity y, si procede, evaluación del formato final de documentación y del servicio de soporte. No se deduce su conformidad de la del portal ni se inventan canales o afirmaciones de producto.

Antes de declarar conformidad, completar los ensayos aplicables, revisión experta y validación empresarial del contenido y ámbito normativo. La matriz y los históricos conservados permiten continuar esa evaluación sin ocultar los pendientes.
