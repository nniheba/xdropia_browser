# XDropia Browser

XDropia Browser es una aplicación de escritorio segura para Windows y macOS que permite a los usuarios acceder a credenciales de servicios web basados en su plan de suscripción.

## Características

- Inicio de sesión sincronizado con WordPress usando la API REST
- Control de acceso para sesiones únicas por cuenta (excepto cuentas de equipo)
- Interfaz de usuario que muestra credenciales como tarjetas visuales
- Panel de administración para gestión de credenciales y estadísticas
- Características de seguridad avanzadas (desactivación de herramientas de inspección, ocultamiento de datos sensibles)
- Panel de estado para herramientas disponibles
- Soporte multiusuario para planes de equipo (5 sesiones concurrentes)
- Entorno cifrado y controlado

## Requisitos del Sistema

### Windows
- Windows 10 o superior
- 4GB de RAM mínimo
- 500MB de espacio en disco

### macOS
- macOS 10.13 (High Sierra) o superior
- 4GB de RAM mínimo
- 500MB de espacio en disco

## Instalación

### Windows
1. Descargue el instalador `XDropia-Browser-Setup-x.x.x.exe` de la sección de releases
2. Ejecute el instalador y siga las instrucciones en pantalla
3. Una vez completada la instalación, XDropia Browser estará disponible en el menú de inicio

### macOS
1. Descargue el archivo `XDropia-Browser-x.x.x.dmg` de la sección de releases
2. Monte el archivo DMG haciendo doble clic en él
3. Arrastre XDropia Browser a la carpeta Aplicaciones
4. Ejecute XDropia Browser desde la carpeta Aplicaciones o desde el Launchpad

## Compilación desde el Código Fuente

Si desea compilar XDropia Browser desde el código fuente, siga estas instrucciones:

### Requisitos Previos
- Node.js 18 o superior
- npm 8 o superior
- Git

### Pasos para Compilar

1. Clone el repositorio:
```bash
git clone https://github.com/nniheba/xdropia_browser.git
cd xdropia_browser
```

2. Instale las dependencias:
```bash
npm install
```

3. Compile la aplicación:

Para Windows:
```bash
npm run build:win
```

Para macOS:
```bash
npm run build:mac
```

4. Los instaladores generados se encontrarán en la carpeta `release`

## Uso

### Inicio de Sesión
1. Inicie XDropia Browser
2. Ingrese sus credenciales de WordPress (email y contraseña)
3. Haga clic en "Iniciar Sesión"

### Panel Principal
- Después de iniciar sesión, verá tarjetas visuales para cada servicio disponible según su plan de suscripción
- Las tarjetas mostrarán el estado de cada servicio ("Disponible" o "No disponible")
- Haga clic en "Abrir" para acceder al servicio seleccionado

### Panel de Administración (Solo para Administradores)
- Los usuarios administradores tendrán acceso al panel de administración
- Aquí podrá ver estadísticas de usuarios y gestionar credenciales
- Puede añadir nuevas credenciales o renovar las existentes

### Gestión de Sesiones (Plan de Equipo)
- Los usuarios con plan de equipo pueden tener hasta 5 sesiones activas simultáneamente
- Puede ver y gestionar sus sesiones activas desde el panel principal

## Seguridad
XDropia Browser implementa varias medidas de seguridad:
- Cifrado de datos sensibles
- Desactivación de herramientas de inspección del navegador
- Ocultamiento de emails y contraseñas
- Control de sesiones para prevenir accesos no autorizados

## Soporte
Para soporte técnico, contacte a support@xdropia.com o visite nuestro sitio web en [app.xdropia.com](https://app.xdropia.com).
