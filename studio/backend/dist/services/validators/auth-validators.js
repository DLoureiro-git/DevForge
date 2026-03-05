"use strict";
/**
 * Auth Validators - Categoria D: Autenticação & Autorização
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRouteProtection = validateRouteProtection;
exports.validatePasswordSecurity = validatePasswordSecurity;
exports.validateSessionExpiry = validateSessionExpiry;
exports.validateLogout = validateLogout;
// ============================================================================
// D1: ROUTE PROTECTION
// ============================================================================
async function validateRouteProtection(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'auth-001';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'CRITICAL',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar proteção de rotas',
            reproducible: true,
            foundAt: new Date(),
        });
        return {
            passed: false,
            checkId,
            bugs,
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
        };
    }
    const page = await browser.newPage();
    try {
        // Rotas comuns que devem estar protegidas
        const protectedRoutes = [
            '/dashboard',
            '/profile',
            '/settings',
            '/admin',
            '/account',
            '/app',
        ];
        for (const route of protectedRoutes) {
            const fullUrl = `${deployUrl}${route}`;
            try {
                const response = await page.goto(fullUrl, { timeout: 10000, waitUntil: 'networkidle' });
                if (response && response.status() === 200) {
                    // Verificar se foi redirecionado para login
                    const currentUrl = page.url();
                    if (!currentUrl.includes('/login') && !currentUrl.includes('/signin') && !currentUrl.includes('/auth')) {
                        // Verificar se o conteúdo da página exige autenticação (não deve ser acessível)
                        const hasProtectedContent = await page.evaluate(() => {
                            const text = document.body.textContent?.toLowerCase() || '';
                            return text.includes('dashboard') || text.includes('profile') || text.includes('settings');
                        });
                        if (hasProtectedContent) {
                            bugs.push({
                                id: `${checkId}-${route.replace(/\//g, '-')}`,
                                checkId,
                                severity: 'CRITICAL',
                                title: `Rota protegida ${route} acessível sem autenticação`,
                                description: `${fullUrl} deve redirecionar para login mas está acessível`,
                                location: fullUrl,
                                screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
                                reproducible: true,
                                foundAt: new Date(),
                            });
                        }
                    }
                }
            }
            catch (error) {
                // 404 ou timeout é OK (rota não existe)
                continue;
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'CRITICAL',
            title: 'Exceção ao validar proteção de rotas',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
        await page.close();
    }
    return {
        passed: bugs.length === 0,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
    };
}
// ============================================================================
// D2: PASSWORD SECURITY
// ============================================================================
async function validatePasswordSecurity(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'auth-002';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'CRITICAL',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar segurança de passwords',
            reproducible: true,
            foundAt: new Date(),
        });
        return {
            passed: false,
            checkId,
            bugs,
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
        };
    }
    const page = await browser.newPage();
    try {
        // Procurar por página de signup/register
        const signupUrls = [
            `${deployUrl}/signup`,
            `${deployUrl}/register`,
            `${deployUrl}/auth/signup`,
            `${deployUrl}/auth/register`,
        ];
        let signupPage = null;
        for (const url of signupUrls) {
            try {
                const response = await page.goto(url, { timeout: 10000, waitUntil: 'networkidle' });
                if (response && response.status() === 200) {
                    signupPage = url;
                    break;
                }
            }
            catch {
                continue;
            }
        }
        if (!signupPage) {
            bugs.push({
                id: `${checkId}-no-signup`,
                checkId,
                severity: 'MEDIUM',
                title: 'Página de signup não encontrada',
                description: 'Impossível testar validação de password',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro crítico se não há signup
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Procurar input de password
        const passwordInput = await page.$('input[type="password"]');
        if (!passwordInput) {
            bugs.push({
                id: `${checkId}-no-password-input`,
                checkId,
                severity: 'HIGH',
                title: 'Input de password não encontrado na página de signup',
                description: 'Página de signup não tem campo de password',
                location: signupPage,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: false,
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Testar passwords fracas
        const weakPasswords = ['123', '12345', 'password', 'abc', '1234'];
        for (const weakPass of weakPasswords) {
            await passwordInput.fill(weakPass);
            // Procurar botão de submit
            const submitButton = await page.$('button[type="submit"], input[type="submit"]');
            if (submitButton) {
                // Verificar se botão está desabilitado ou se há erro de validação
                const isDisabled = await submitButton.isDisabled();
                if (!isDisabled) {
                    // Clicar e ver se mostra erro
                    await submitButton.click();
                    await page.waitForTimeout(1000);
                    // Verificar se há mensagem de erro
                    const errorMessage = await page.evaluate(() => {
                        const text = document.body.textContent?.toLowerCase() || '';
                        return text.includes('password') && (text.includes('must be') ||
                            text.includes('pelo menos') ||
                            text.includes('mínimo') ||
                            text.includes('fraca'));
                    });
                    if (!errorMessage) {
                        bugs.push({
                            id: `${checkId}-weak-password-accepted`,
                            checkId,
                            severity: 'CRITICAL',
                            title: 'Password fraca aceite',
                            description: `Password "${weakPass}" não foi rejeitada`,
                            location: signupPage,
                            screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
                            reproducible: true,
                            foundAt: new Date(),
                        });
                        break;
                    }
                }
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'CRITICAL',
            title: 'Exceção ao validar segurança de passwords',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
        await page.close();
    }
    return {
        passed: bugs.length === 0,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
    };
}
// ============================================================================
// D3: SESSION EXPIRY
// ============================================================================
async function validateSessionExpiry(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'auth-003';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar expiração de sessão',
            reproducible: true,
            foundAt: new Date(),
        });
        return {
            passed: false,
            checkId,
            bugs,
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
        };
    }
    const page = await browser.newPage();
    try {
        await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        // Verificar se há cookies de sessão
        const cookies = await page.context().cookies();
        const sessionCookies = cookies.filter(c => c.name.includes('session') ||
            c.name.includes('token') ||
            c.name.includes('auth'));
        if (sessionCookies.length === 0) {
            bugs.push({
                id: `${checkId}-no-session-cookies`,
                checkId,
                severity: 'MEDIUM',
                title: 'Nenhum cookie de sessão encontrado',
                description: 'Impossível validar expiração de sessão',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro se app não usa cookies
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Verificar se cookies têm maxAge ou expires
        const cookiesWithoutExpiry = sessionCookies.filter(c => !c.expires || c.expires === -1);
        if (cookiesWithoutExpiry.length > 0) {
            bugs.push({
                id: `${checkId}-no-expiry`,
                checkId,
                severity: 'HIGH',
                title: `${cookiesWithoutExpiry.length} cookies de sessão sem expiração`,
                description: cookiesWithoutExpiry.map(c => c.name).join(', '),
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Verificar se cookies de sessão são httpOnly e secure
        const insecureCookies = sessionCookies.filter(c => !c.httpOnly || !c.secure);
        if (insecureCookies.length > 0) {
            bugs.push({
                id: `${checkId}-insecure-cookies`,
                checkId,
                severity: 'CRITICAL',
                title: `${insecureCookies.length} cookies de sessão sem httpOnly/secure`,
                description: insecureCookies.map(c => `${c.name} (httpOnly: ${c.httpOnly}, secure: ${c.secure})`).join('\n'),
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'HIGH',
            title: 'Exceção ao validar expiração de sessão',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
        await page.close();
    }
    return {
        passed: bugs.length === 0,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
    };
}
// ============================================================================
// D4: LOGOUT
// ============================================================================
async function validateLogout(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'auth-004';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar logout',
            reproducible: true,
            foundAt: new Date(),
        });
        return {
            passed: false,
            checkId,
            bugs,
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
        };
    }
    const page = await browser.newPage();
    try {
        await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        // Procurar por botão/link de logout
        const logoutSelectors = [
            'button:has-text("Logout")',
            'button:has-text("Sair")',
            'a:has-text("Logout")',
            'a:has-text("Sair")',
            '[data-testid="logout"]',
            '[id*="logout"]',
        ];
        let logoutButton = null;
        for (const selector of logoutSelectors) {
            try {
                logoutButton = await page.$(selector);
                if (logoutButton)
                    break;
            }
            catch {
                continue;
            }
        }
        if (!logoutButton) {
            bugs.push({
                id: `${checkId}-no-logout-button`,
                checkId,
                severity: 'MEDIUM',
                title: 'Botão de logout não encontrado',
                description: 'Impossível testar funcionalidade de logout',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro se não há botão visível (pode estar protegido)
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        // Guardar cookies antes do logout
        const cookiesBefore = await page.context().cookies();
        // Clicar em logout
        await logoutButton.click();
        await page.waitForTimeout(2000);
        // Verificar se cookies foram limpos
        const cookiesAfter = await page.context().cookies();
        const sessionCookiesBefore = cookiesBefore.filter(c => c.name.includes('session') ||
            c.name.includes('token') ||
            c.name.includes('auth'));
        const sessionCookiesAfter = cookiesAfter.filter(c => c.name.includes('session') ||
            c.name.includes('token') ||
            c.name.includes('auth'));
        if (sessionCookiesAfter.length >= sessionCookiesBefore.length) {
            bugs.push({
                id: `${checkId}-cookies-not-cleared`,
                checkId,
                severity: 'CRITICAL',
                title: 'Cookies de sessão não foram limpos após logout',
                description: `Antes: ${sessionCookiesBefore.map(c => c.name).join(', ')}\nDepois: ${sessionCookiesAfter.map(c => c.name).join(', ')}`,
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Verificar se foi redirecionado
        const currentUrl = page.url();
        const wasRedirected = currentUrl.includes('/login') || currentUrl.includes('/signin') || currentUrl === deployUrl;
        if (!wasRedirected) {
            bugs.push({
                id: `${checkId}-no-redirect`,
                checkId,
                severity: 'MEDIUM',
                title: 'Logout não redirecionou para página pública',
                description: `URL atual: ${currentUrl}`,
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'HIGH',
            title: 'Exceção ao validar logout',
            description: error instanceof Error ? error.message : String(error),
            stackTrace: error instanceof Error ? error.stack : undefined,
            reproducible: true,
            foundAt: new Date(),
        });
    }
    finally {
        await page.close();
    }
    return {
        passed: bugs.length === 0,
        checkId,
        bugs,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
    };
}
