# CustomIA Shopify Widget

Bloque visual independiente para productos de Shopify que permite al cliente cargar una foto de su mascota antes de agregar el producto al carrito. El bloque guarda el identificador devuelto por tu servidor como una propiedad privada de la linea de carrito: `_customia3d_job_id`.

El repositorio contiene solamente la interfaz de la tienda y su demo. No incluye Modly, modelos de IA, una cola de trabajos ni almacenamiento de fotos.

## Demo local

Requiere Node.js 20 o superior. No hay dependencias que instalar.

```bash
npm run demo
```

Abre `http://127.0.0.1:4174`.

## Integración en Shopify

1. En la computadora donde administras la app Shopify, clona este repositorio.
2. Copia `extensions/customia-3d-product` dentro de la carpeta `extensions/` de tu app Shopify existente.
3. Ejecuta `shopify app dev` y agrega el bloque **CustomIA 3D** en la plantilla del producto desde el editor del tema.
4. En el bloque, configura la ruta del App Proxy. La ruta predeterminada es `/apps/customia-3d`.
5. Si tu tema muestra más de un formulario de compra, escribe el selector CSS del formulario correcto, por ejemplo `#product-form-main`. En los demás casos se detecta automáticamente.

El bloque funciona con un App Proxy que acepte este contrato:

```text
POST /apps/customia-3d/jobs
Content-Type: multipart/form-data

photo: archivo JPG, PNG o WebP
productId: identificador de producto de Shopify
productHandle: handle de producto
```

Tu endpoint debe responder exitosamente con:

```json
{ "jobId": "identificador-privado-del-trabajo" }
```

El widget añade ese valor al producto mediante `properties[_customia3d_job_id]`. La generación, cobro, aprobación y entrega del STL quedan del lado de tu aplicación y trabajador de IA.

## Estructura

- `extensions/customia-3d-product`: Theme App Extension con Liquid, JavaScript y estilos.
- `demo`: producto ficticio para revisar la experiencia sin iniciar sesión en Shopify.
- `scripts/demo-server.mjs`: servidor local sin dependencias.
