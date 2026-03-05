/**
 * Responsive Validators - Categoria B: Responsive & Mobile
 */
const BREAKPOINTS = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 390, height: 844, name: 'iPhone 12/13' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1024, height: 768, name: 'Tablet Landscape' },
    { width: 1440, height: 900, name: 'Desktop' },
];
const MIN_TOUCH_TARGET = 44; // pixels (WCAG AAA)
const MIN_MOBILE_FONT_SIZE = 14; // pixels
// ============================================================================
// B1: HORIZONTAL OVERFLOW
// ============================================================================
export async function checkHorizontalOverflow(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'responsive-001';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'CRITICAL',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar responsive',
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
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
            // Verificar overflow horizontal
            const hasOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            if (hasOverflow) {
                const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
                const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
                bugs.push({
                    id: `${checkId}-${breakpoint.name.replace(/\s/g, '-')}`,
                    checkId,
                    severity: 'CRITICAL',
                    title: `Overflow horizontal em ${breakpoint.name}`,
                    description: `Página tem ${scrollWidth}px de largura mas viewport é ${clientWidth}px`,
                    location: `${deployUrl} @ ${breakpoint.width}x${breakpoint.height}`,
                    screenshot: await page.screenshot({ fullPage: false }),
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
            // Verificar elementos que causam overflow
            const overflowingElements = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                const viewport = document.documentElement.clientWidth;
                return elements
                    .filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.right > viewport;
                })
                    .map(el => ({
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    width: el.getBoundingClientRect().width,
                }))
                    .slice(0, 5);
            });
            if (overflowingElements.length > 0) {
                bugs.push({
                    id: `${checkId}-elements-${breakpoint.name.replace(/\s/g, '-')}`,
                    checkId,
                    severity: 'HIGH',
                    title: `${overflowingElements.length}+ elementos excedem viewport em ${breakpoint.name}`,
                    description: JSON.stringify(overflowingElements, null, 2),
                    location: `${deployUrl} @ ${breakpoint.width}x${breakpoint.height}`,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'CRITICAL',
            title: 'Exceção ao verificar overflow',
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
// B2: TOUCH TARGETS
// ============================================================================
export async function checkTouchTargets(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'responsive-002';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar touch targets',
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
        // Testar em mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        const smallTouchTargets = await page.evaluate((minSize) => {
            const interactiveSelectors = 'button, a, input, select, textarea, [role="button"], [onclick]';
            const elements = Array.from(document.querySelectorAll(interactiveSelectors));
            return elements
                .map(el => {
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    text: el.textContent?.trim().substring(0, 30) || '',
                    width: rect.width,
                    height: rect.height,
                    tooSmall: rect.width < minSize || rect.height < minSize,
                };
            })
                .filter(item => item.tooSmall && item.width > 0 && item.height > 0)
                .slice(0, 10);
        }, MIN_TOUCH_TARGET);
        if (smallTouchTargets.length > 0) {
            bugs.push({
                id: `${checkId}-small-targets`,
                checkId,
                severity: 'HIGH',
                title: `${smallTouchTargets.length}+ elementos interativos abaixo de ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px`,
                description: JSON.stringify(smallTouchTargets, null, 2),
                location: `${deployUrl} @ 375x667`,
                screenshot: await page.screenshot({ fullPage: false }),
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
            title: 'Exceção ao verificar touch targets',
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
// B3: BREAKPOINTS
// ============================================================================
export async function validateBreakpoints(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'responsive-003';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar breakpoints',
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
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
            // Verificar se página carregou
            const bodyText = await page.textContent('body');
            if (!bodyText || bodyText.trim().length === 0) {
                bugs.push({
                    id: `${checkId}-empty-${breakpoint.name.replace(/\s/g, '-')}`,
                    checkId,
                    severity: 'CRITICAL',
                    title: `Página vazia em ${breakpoint.name}`,
                    description: `Nenhum conteúdo visível em ${breakpoint.width}x${breakpoint.height}`,
                    location: `${deployUrl} @ ${breakpoint.width}x${breakpoint.height}`,
                    screenshot: await page.screenshot({ fullPage: false }),
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
            // Verificar erros de layout
            const layoutErrors = await page.evaluate(() => {
                const issues = [];
                // Verificar elementos com display:none que podem ser falsos positivos de mobile
                const hiddenElements = Array.from(document.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return style.display === 'none' && el.children.length > 5;
                });
                if (hiddenElements.length > 3) {
                    issues.push(`${hiddenElements.length} elementos grandes com display:none`);
                }
                return issues;
            });
            if (layoutErrors.length > 0) {
                bugs.push({
                    id: `${checkId}-layout-${breakpoint.name.replace(/\s/g, '-')}`,
                    checkId,
                    severity: 'MEDIUM',
                    title: `Problemas de layout em ${breakpoint.name}`,
                    description: layoutErrors.join('\n'),
                    location: `${deployUrl} @ ${breakpoint.width}x${breakpoint.height}`,
                    reproducible: true,
                    foundAt: new Date(),
                });
            }
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'HIGH',
            title: 'Exceção ao validar breakpoints',
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
// B4: TEXT READABILITY
// ============================================================================
export async function validateTextReadability(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'responsive-004';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'MEDIUM',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar legibilidade',
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
        // Testar em mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
        const smallText = await page.evaluate((minSize) => {
            const textElements = Array.from(document.querySelectorAll('p, span, div, a, button, li, td, th, label'));
            return textElements
                .filter(el => {
                const text = el.textContent?.trim() || '';
                return text.length > 0;
            })
                .map(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                return {
                    tag: el.tagName,
                    class: el.className,
                    id: el.id,
                    fontSize,
                    text: el.textContent?.trim().substring(0, 30) || '',
                    tooSmall: fontSize < minSize,
                };
            })
                .filter(item => item.tooSmall)
                .slice(0, 10);
        }, MIN_MOBILE_FONT_SIZE);
        if (smallText.length > 0) {
            bugs.push({
                id: `${checkId}-small-font`,
                checkId,
                severity: 'MEDIUM',
                title: `${smallText.length}+ elementos com texto abaixo de ${MIN_MOBILE_FONT_SIZE}px em mobile`,
                description: JSON.stringify(smallText, null, 2),
                location: `${deployUrl} @ 375x667`,
                screenshot: await page.screenshot({ fullPage: false }),
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Verificar contraste baixo (simplificado)
        const lowContrastElements = await page.evaluate(() => {
            const textElements = Array.from(document.querySelectorAll('p, span, div, a, button'));
            return textElements
                .filter(el => {
                const text = el.textContent?.trim() || '';
                return text.length > 10;
            })
                .map(el => {
                const style = window.getComputedStyle(el);
                const color = style.color;
                const bgColor = style.backgroundColor;
                return {
                    tag: el.tagName,
                    class: el.className,
                    color,
                    bgColor,
                    text: el.textContent?.trim().substring(0, 30) || '',
                };
            })
                .filter(item => {
                // Detectar cinza claro em branco (muito comum)
                return item.color.includes('rgb(200') || item.color.includes('rgb(220');
            })
                .slice(0, 5);
        });
        if (lowContrastElements.length > 0) {
            bugs.push({
                id: `${checkId}-low-contrast`,
                checkId,
                severity: 'MEDIUM',
                title: `${lowContrastElements.length}+ elementos com possível baixo contraste`,
                description: JSON.stringify(lowContrastElements, null, 2),
                location: `${deployUrl} @ 375x667`,
                reproducible: true,
                foundAt: new Date(),
            });
        }
    }
    catch (error) {
        bugs.push({
            id: `${checkId}-exception`,
            checkId,
            severity: 'MEDIUM',
            title: 'Exceção ao validar legibilidade',
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
