/**
 * Tenant Store — Armazena o tenantId atual para uso global
 * 
 * Funciona tanto no client (TenantProvider seta via setTenantId)
 * quanto no server (API routes leem do cookie via getTenantIdFromCookies)
 * 
 * @module lib/auth/tenantStore
 */

let _tenantId = null;

/**
 * Define o tenantId atual (chamado pelo TenantProvider no login)
 */
export function setTenantId(id) {
    _tenantId = id;

    // Também salva em cookie para API routes lerem no server-side
    if (typeof document !== 'undefined' && id) {
        document.cookie = `tenantId=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
}

/**
 * Obtém o tenantId atual
 * 1. Tenta variável de módulo (client-side, setado pelo TenantProvider)
 * 2. Tenta cookie (fallback para SSR ou API routes)
 */
export function getTenantId() {
    // 1. Variável de módulo (mais rápido, sempre disponível no client)
    if (_tenantId) return _tenantId;

    // 2. Fallback: ler do cookie no browser
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(/tenantId=([^;]+)/);
        if (match) {
            _tenantId = match[1]; // Cache para próxima chamada
            return _tenantId;
        }
    }

    return null;
}

/**
 * Para uso em API routes (server-side)
 * Extrai tenantId do header da request
 */
export function getTenantIdFromRequest(request) {
    // 1. Header explícito
    const headerTenantId = request.headers.get('x-tenant-id');
    if (headerTenantId) return headerTenantId;

    // 2. Cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/tenantId=([^;]+)/);
    if (match) return match[1];

    return null;
}

/**
 * Limpa o tenantId (chamado no logout)
 */
export function clearTenantId() {
    _tenantId = null;
    if (typeof document !== 'undefined') {
        document.cookie = 'tenantId=; path=/; max-age=0';
    }
}
