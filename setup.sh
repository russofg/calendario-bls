#!/bin/bash

# EventPro - Script de Configuración
echo "🚀 Configurando EventPro - Versión Refactorizada"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor, instala Node.js 16 o superior."
    exit 1
fi

print_message "Node.js encontrado: $(node --version)"

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor, instala npm."
    exit 1
fi

print_message "npm encontrado: $(npm --version)"

# Instalar dependencias
print_info "Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    print_message "Dependencias instaladas correctamente"
else
    print_error "Error al instalar dependencias"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    print_info "Creando archivo .env..."
    cp env.example .env
    print_warning "Archivo .env creado. Por favor, configura tus variables de Firebase."
else
    print_message "Archivo .env ya existe"
fi

# Verificar estructura de archivos
print_info "Verificando estructura del proyecto..."

required_files=(
    "js/main.js"
    "js/config/firebase.js"
    "js/config/constants.js"
    "js/utils/dom.js"
    "js/utils/helpers.js"
    "js/utils/notifications.js"
    "js/modules/appState.js"
    "js/modules/authManager.js"
    "js/modules/eventManager.js"
    "js/modules/technicianManager.js"
    "js/modules/calendarManager.js"
    "js/modules/uiManager.js"
    "vite.config.js"
    "tailwind.config.js"
    ".eslintrc.js"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    print_message "Estructura del proyecto verificada correctamente"
else
    print_error "Faltan los siguientes archivos:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Ejecutar linting
print_info "Ejecutando linting..."
npm run lint

if [ $? -eq 0 ]; then
    print_message "Linting completado sin errores"
else
    print_warning "Linting completado con advertencias"
fi

# Formatear código
print_info "Formateando código..."
npm run format

if [ $? -eq 0 ]; then
    print_message "Código formateado correctamente"
else
    print_error "Error al formatear código"
fi

# Construir proyecto
print_info "Construyendo proyecto..."
npm run build

if [ $? -eq 0 ]; then
    print_message "Proyecto construido correctamente"
else
    print_error "Error al construir el proyecto"
    exit 1
fi

# Mostrar información final
echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de Firebase en el archivo .env"
echo "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
echo "3. Abre http://localhost:8000 en tu navegador"
echo ""
echo "🛠️  Scripts disponibles:"
echo "  npm run dev      - Servidor de desarrollo"
echo "  npm run build    - Construir para producción"
echo "  npm run preview  - Previsualizar build"
echo "  npm run lint     - Ejecutar ESLint"
echo "  npm run format   - Formatear código"
echo ""
echo "📚 Documentación:"
echo "  - README-REFACTOR.md - Documentación de la refactorización"
echo "  - Comentarios en el código - Guías de uso"
echo ""
print_message "¡EventPro está listo para usar!"
