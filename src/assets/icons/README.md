# Iconos corporativos opcionales

Esta carpeta recibe los SVG originales aprobados por el diseñador. No contiene iconos provisionales ni espacios reservados. Se prevén 15 iconos principales; los seis hijos pueden permanecer sin icono.

## Incorporación

1. Guardar cada archivo con el identificador estable del artículo, por ejemplo `binding-technology.svg`. No utilizar su posición en el menú como clave.
2. Usar `viewBox="0 0 24 24"` en todos los recursos y optimizar el archivo conservando la forma aprobada. No incluir scripts, manejadores de eventos, referencias remotas, tipografías incrustadas ni imágenes rasterizadas.
3. Importar el archivo como URL en `src/data/icons.ts` y añadirlo al registro por su identificador:

```ts
import bindingTechnologySvg from '../assets/icons/binding-technology.svg?url';

export const documentationIcons: DocumentationIconRegistry = {
  'binding-technology': { src: bindingTechnologySvg },
};
```

Este ejemplo documenta la integración; el archivo SVG todavía no se ha facilitado. No añadir el import hasta que exista el recurso aprobado. Las claves del registro están tipadas con los 21 identificadores válidos; no es obligatorio asignar un icono a cada uno.

Vite resuelve la URL importada con el `base` de Astro. No anteponer `withBase` de nuevo ni escribir `/src/assets/…` manualmente. Con `?url`, Vite puede incorporar un SVG pequeño como URL de datos; si la política del proyecto exige un archivo separado, se puede utilizar su modificador `?no-inline` junto a `?url` y añadir la declaración TypeScript correspondiente, comprobando después el build con prefijo.

`DocumentationIcon.astro` recibe `id` y emite una imagen de 24×24 solo cuando hay un recurso registrado. La imagen es decorativa (`alt=""`, `aria-hidden="true"`); el título completo del enlace sigue siendo su nombre accesible. No añadir `<title>` visible como otro texto del enlace, ni depender del icono para indicar la página activa. El registro actual está vacío y el componente no emite un contenedor vacío en ese caso.

El componente usa una imagen externa al DOM SVG; no reescribe colores internos ni simula cambios de estado. Los estados de foco, hover y página activa siguen perteneciendo al enlace y funcionan aunque no haya icono. Cualquier futura versión SVG inline debe conservar la misma semántica decorativa y comprobar por separado sus colores de estado.

El registro de `src/data/icons.ts` pertenece al build de Vite y puede importar los recursos SVG. Los tipos y el helper puro `getDocumentationIcon(id, registry)` viven en `src/lib/documentation-icons.ts`; sus pruebas pueden usar metadatos simulados sin cargar el registro ni necesitar un loader SVG en Node. El componente Astro pasa el registro real al helper de forma explícita.

## Comprobación antes de registrar recursos

Revisar la procedencia, el `viewBox`, los elementos y atributos permitidos y las referencias del SVG. El tipado del registro no sustituye esa inspección. Después ejecutar TypeScript, build, Playwright/axe y pruebas de `/documentacion/`; comprobar que no cambia el nombre accesible del enlace y que los SVG no generan peticiones fallidas. Los iconos empresariales reales y su validación visual quedan pendientes de entrega del diseñador.
