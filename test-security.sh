#!/bin/bash

# 🧪 Script de Pruebas de Seguridad OWASP Top 10 2021
# Este script prueba las protecciones implementadas

echo "🛡️ Iniciando pruebas de seguridad OWASP Top 10 2021..."
echo "========================================================="

BASE_URL="http://localhost:3000"
TOKEN=""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para obtener token
get_token() {
    echo -e "${BLUE}🔑 Obteniendo token de autenticación...${NC}"
    RESPONSE=$(curl -s -X POST ${BASE_URL}/login \
        -H "Content-Type: application/json" \
        -d '{"username": "admin", "password": "admin123"}')
    
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✅ Token obtenido exitosamente${NC}"
    else
        echo -e "${RED}❌ Error obteniendo token${NC}"
        exit 1
    fi
}

# A01:2021 - Broken Access Control
test_access_control() {
    echo -e "\n${YELLOW}🔒 A01:2021 - Probando Control de Acceso...${NC}"
    
    # Probar acceso sin token
    echo "   - Probando acceso sin autenticación..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/productos)
    if [ "$STATUS" = "401" ]; then
        echo -e "   ${GREEN}✅ Acceso denegado correctamente sin token${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Acceso permitido sin token (Status: $STATUS)${NC}"
    fi
    
    # Probar con token válido
    echo "   - Probando acceso con token válido..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/productos \
        -H "Authorization: Bearer $TOKEN")
    if [ "$STATUS" = "200" ]; then
        echo -e "   ${GREEN}✅ Acceso permitido con token válido${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Acceso denegado con token válido (Status: $STATUS)${NC}"
    fi
}

# A02:2021 - Cryptographic Failures
test_crypto_failures() {
    echo -e "\n${YELLOW}🔐 A02:2021 - Probando Fallos Criptográficos...${NC}"
    
    # Verificar headers de seguridad
    echo "   - Verificando headers de seguridad criptográfica..."
    HEADERS=$(curl -s -I ${BASE_URL}/ | grep -E "(Strict-Transport-Security|X-Content-Type-Options)")
    if [ -n "$HEADERS" ]; then
        echo -e "   ${GREEN}✅ Headers de seguridad criptográfica presentes${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Headers de seguridad faltantes${NC}"
    fi
}

# A03:2021 - Injection
test_injection() {
    echo -e "\n${YELLOW}💉 A03:2021 - Probando Protección contra Inyección...${NC}"
    
    # Probar inyección SQL
    echo "   - Probando inyección SQL..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/productos \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -X POST \
        -d '{"name": "Test; DROP TABLE products;--"}')
    
    if [ "$STATUS" = "400" ]; then
        echo -e "   ${GREEN}✅ Inyección SQL bloqueada correctamente${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Inyección SQL no detectada (Status: $STATUS)${NC}"
    fi
    
    # Probar XSS
    echo "   - Probando XSS..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/productos \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -X POST \
        -d '{"name": "<script>alert(\"XSS\")</script>"}')
    
    if [ "$STATUS" = "400" ]; then
        echo -e "   ${GREEN}✅ XSS bloqueado correctamente${NC}"
    else
        echo -e "   ${RED}❌ Fallo: XSS no detectado (Status: $STATUS)${NC}"
    fi
}

# A04:2021 - Insecure Design
test_insecure_design() {
    echo -e "\n${YELLOW}🏗️ A04:2021 - Probando Diseño Inseguro...${NC}"
    
    # Probar rate limiting
    echo "   - Probando rate limiting..."
    local count=0
    for i in {1..15}; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/health)
        if [ "$STATUS" = "429" ]; then
            count=$((count + 1))
            break
        fi
        sleep 0.1
    done
    
    if [ $count -gt 0 ]; then
        echo -e "   ${GREEN}✅ Rate limiting funcionando${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Rate limiting no activado en este intento${NC}"
    fi
}

# A05:2021 - Security Misconfiguration
test_security_misconfiguration() {
    echo -e "\n${YELLOW}⚙️ A05:2021 - Probando Configuración de Seguridad...${NC}"
    
    # Verificar headers de seguridad
    echo "   - Verificando headers de seguridad..."
    HEADERS=$(curl -s -I ${BASE_URL}/ | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)")
    if [ -n "$HEADERS" ]; then
        echo -e "   ${GREEN}✅ Headers de seguridad configurados${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Headers de seguridad faltantes${NC}"
    fi
    
    # Verificar que X-Powered-By esté removido
    echo "   - Verificando que X-Powered-By esté removido..."
    POWERED_BY=$(curl -s -I ${BASE_URL}/ | grep -i "x-powered-by")
    if [ -z "$POWERED_BY" ]; then
        echo -e "   ${GREEN}✅ X-Powered-By removido correctamente${NC}"
    else
        echo -e "   ${RED}❌ Fallo: X-Powered-By visible${NC}"
    fi
}

# A07:2021 - Identification and Authentication Failures
test_auth_failures() {
    echo -e "\n${YELLOW}🔑 A07:2021 - Probando Fallos de Autenticación...${NC}"
    
    # Probar credenciales incorrectas
    echo "   - Probando credenciales incorrectas..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/login \
        -H "Content-Type: application/json" \
        -d '{"username": "admin", "password": "wrong"}')
    
    if [ "$STATUS" = "401" ]; then
        echo -e "   ${GREEN}✅ Credenciales incorrectas rechazadas${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Credenciales incorrectas aceptadas (Status: $STATUS)${NC}"
    fi
    
    # Probar login sin datos
    echo "   - Probando login sin datos..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/login \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if [ "$STATUS" = "400" ]; then
        echo -e "   ${GREEN}✅ Login sin datos rechazado${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Login sin datos aceptado (Status: $STATUS)${NC}"
    fi
}

# A09:2021 - Security Logging and Monitoring Failures
test_logging_monitoring() {
    echo -e "\n${YELLOW}📊 A09:2021 - Probando Logging y Monitoreo...${NC}"
    
    # Verificar que el directorio de logs existe
    if [ -d "./logs" ]; then
        echo -e "   ${GREEN}✅ Directorio de logs existe${NC}"
        
        # Verificar archivos de log
        if [ -f "./logs/security.log" ] || [ -f "./logs/errors.log" ] || [ -f "./logs/audit.log" ]; then
            echo -e "   ${GREEN}✅ Archivos de log creados${NC}"
        else
            echo -e "   ${YELLOW}⚠️ Archivos de log aún no creados (normal en primera ejecución)${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️ Directorio de logs no existe aún${NC}"
    fi
}

# A10:2021 - Server-Side Request Forgery
test_ssrf() {
    echo -e "\n${YELLOW}🌐 A10:2021 - Probando SSRF...${NC}"
    
    # Probar acceso a localhost
    echo "   - Probando acceso a localhost..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/webhook \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"url": "http://localhost:22"}')
    
    if [ "$STATUS" = "400" ]; then
        echo -e "   ${GREEN}✅ SSRF a localhost bloqueado${NC}"
    else
        echo -e "   ${RED}❌ Fallo: SSRF a localhost permitido (Status: $STATUS)${NC}"
    fi
    
    # Probar protocolo file
    echo "   - Probando protocolo file..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/webhook \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"url": "file:///etc/passwd"}')
    
    if [ "$STATUS" = "400" ]; then
        echo -e "   ${GREEN}✅ Protocolo file bloqueado${NC}"
    else
        echo -e "   ${RED}❌ Fallo: Protocolo file permitido (Status: $STATUS)${NC}"
    fi
}

# Función principal
main() {
    echo "Iniciando servidor en background..."
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    
    echo "Esperando que el servidor inicie..."
    sleep 3
    
    # Verificar si el servidor está corriendo
    if curl -s ${BASE_URL}/health > /dev/null; then
        echo -e "${GREEN}✅ Servidor iniciado correctamente${NC}"
    else
        echo -e "${RED}❌ Error: Servidor no responde${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    # Obtener token para las pruebas
    get_token
    
    # Ejecutar todas las pruebas
    test_access_control
    test_crypto_failures
    test_injection
    test_insecure_design
    test_security_misconfiguration
    test_auth_failures
    test_logging_monitoring
    test_ssrf
    
    echo -e "\n${BLUE}=========================================================${NC}"
    echo -e "${GREEN}🎉 Pruebas de seguridad completadas${NC}"
    echo -e "${BLUE}=========================================================${NC}"
    
    # Limpiar
    kill $SERVER_PID 2>/dev/null
    echo "Servidor detenido."
}

# Ejecutar si se llama directamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
