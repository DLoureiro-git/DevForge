/**
 * Button Validators - Categoria F: Botões & Interatividade
 */
// ============================================================================
// F1: ALL BUTTONS WORK
// ============================================================================
export async function validateAllButtons(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'buttons-001';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'CRITICAL',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar botões',
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
        // Encontrar todos os botões
        const buttons = await page.$$('button, [role="button"], input[type="button"], input[type="submit"]');
        if (buttons.length === 0) {
            bugs.push({
                id: `${checkId}-no-buttons`,
                checkId,
                severity: 'MEDIUM',
                title: 'Nenhum botão encontrado',
                description: 'Página não tem botões para testar',
                location: deployUrl,
                reproducible: true,
                foundAt: new Date(),
            });
            return {
                passed: true, // não é erro se não há botões
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        const brokenButtons = [];
        for (let i = 0; i < Math.min(buttons.length, 20); i++) {
            const button = buttons[i];
            // Verificar se botão está visível
            const isVisible = await button.isVisible();
            if (!isVisible)
                continue;
            const buttonInfo = await button.evaluate(el => ({
                text: el.textContent?.trim() || '',
                id: el.id,
                class: el.className,
                disabled: el.disabled,
            }));
            if (buttonInfo.disabled)
                continue;
            // Verificar se tem onclick ou evento
            const hasHandler = await button.evaluate(el => {
                return el.onclick !== null ||
                    el.hasAttribute('onclick') ||
                    el.getAttribute('type') === 'submit';
            });
            if (!hasHandler) {
                brokenButtons.push(buttonInfo);
            }
        }
        if (brokenButtons.length > 0) {
            bugs.push({
                id: `${checkId}-no-handlers`,
                checkId,
                severity: 'HIGH',
                title: `${brokenButtons.length} botões sem handler`,
                description: JSON.stringify(brokenButtons.slice(0, 5), null, 2),
                location: deployUrl,
                screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Testar cliques (máximo 5 botões)
        const clickErrors = [];
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const button = buttons[i];
            const isVisible = await button.isVisible();
            const isDisabled = await button.isDisabled();
            if (!isVisible || isDisabled)
                continue;
            try {
                // Guardar URL antes do clique
                const urlBefore = page.url();
                await button.click({ timeout: 3000 });
                await page.waitForTimeout(1000);
                // Verificar se algo aconteceu (mudança de URL, modal abriu, etc)
                const urlAfter = page.url();
                const hasModal = await page.$('[role="dialog"], .modal, [class*="modal"]');
                const buttonText = await button.textContent();
                if (urlBefore === urlAfter && !hasModal) {
                    // Verificar se é botão de submit (pode estar esperando form válido)
                    const isSubmit = await button.evaluate(el => el.type === 'submit');
                    if (!isSubmit) {
                        clickErrors.push(`"${buttonText?.trim()}" não fez nada`);
                    }
                }
                // Voltar à página inicial se mudou
                if (urlBefore !== urlAfter) {
                    await page.goto(deployUrl, { timeout: 30000, waitUntil: 'networkidle' });
                }
            }
            catch (error) {
                const buttonText = await button.textContent();
                clickErrors.push(`"${buttonText?.trim()}" deu erro ao clicar`);
            }
        }
        if (clickErrors.length > 0) {
            bugs.push({
                id: `${checkId}-click-errors`,
                checkId,
                severity: 'HIGH',
                title: `${clickErrors.length} botões com problemas`,
                description: clickErrors.join('\n'),
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
            severity: 'CRITICAL',
            title: 'Exceção ao validar botões',
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
// F2: LOADING STATES
// ============================================================================
export async function validateLoadingStates(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'buttons-002';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'HIGH',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar loading states',
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
        // Adicionar delay às requests de API
        await page.route('**/api/**', route => {
            setTimeout(() => route.continue(), 1500);
        });
        // Encontrar botões de submit
        const submitButtons = await page.$$('button[type="submit"], input[type="submit"]');
        if (submitButtons.length === 0) {
            return {
                passed: true, // não é erro se não há botões async
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        const buttonsWithoutLoading = [];
        for (let i = 0; i < Math.min(submitButtons.length, 3); i++) {
            const button = submitButtons[i];
            const isVisible = await button.isVisible();
            const isDisabled = await button.isDisabled();
            if (!isVisible || isDisabled)
                continue;
            const buttonText = await button.textContent();
            // Clicar
            try {
                await button.click({ timeout: 3000 });
                await page.waitForTimeout(300);
                // Verificar loading state
                const isDisabledDuringLoad = await button.isDisabled();
                const hasLoadingIndicator = await page.evaluate(() => {
                    const indicators = ['loading', 'carregando', 'enviando', 'aguarde'];
                    const text = document.body.textContent?.toLowerCase() || '';
                    return indicators.some(ind => text.includes(ind));
                });
                const hasSpinner = await page.evaluate(() => {
                    return document.querySelector('[class*="spin"], [class*="load"], [role="progressbar"]') !== null;
                });
                if (!isDisabledDuringLoad && !hasLoadingIndicator && !hasSpinner) {
                    buttonsWithoutLoading.push(buttonText?.trim() || 'Botão sem texto');
                }
                // Esperar terminar
                await page.waitForTimeout(2000);
            }
            catch {
                // Ignorar erros de clique
            }
        }
        if (buttonsWithoutLoading.length > 0) {
            bugs.push({
                id: `${checkId}-no-loading`,
                checkId,
                severity: 'HIGH',
                title: `${buttonsWithoutLoading.length} botões async sem loading state`,
                description: buttonsWithoutLoading.join(', '),
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
            title: 'Exceção ao validar loading states',
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
// F3: DISABLED STATES
// ============================================================================
export async function validateDisabledStates(browser, projectPath, deployUrl) {
    const startTime = Date.now();
    const bugs = [];
    const checkId = 'buttons-003';
    if (!deployUrl) {
        bugs.push({
            id: `${checkId}-no-url`,
            checkId,
            severity: 'MEDIUM',
            title: 'URL de deploy não fornecida',
            description: 'Impossível testar disabled states',
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
        // Encontrar botões disabled
        const disabledButtons = await page.$$('button[disabled], [role="button"][disabled], input[disabled]');
        if (disabledButtons.length === 0) {
            return {
                passed: true,
                checkId,
                bugs,
                executionTime: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        const clickableDisabled = [];
        for (const button of disabledButtons) {
            const isVisible = await button.isVisible();
            if (!isVisible)
                continue;
            const buttonText = await button.textContent();
            // Verificar se CSS permite clique (pointer-events: auto seria problema)
            const canClick = await button.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.pointerEvents !== 'none' && style.cursor === 'pointer';
            });
            if (canClick) {
                clickableDisabled.push(buttonText?.trim() || 'Botão sem texto');
            }
        }
        if (clickableDisabled.length > 0) {
            bugs.push({
                id: `${checkId}-clickable-disabled`,
                checkId,
                severity: 'MEDIUM',
                title: `${clickableDisabled.length} botões disabled clicáveis`,
                description: `Botões disabled mas com cursor pointer: ${clickableDisabled.join(', ')}`,
                location: deployUrl,
                screenshot: (await page.screenshot({ fullPage: false })).toString("base64"),
                reproducible: true,
                foundAt: new Date(),
            });
        }
        // Verificar se botões disabled têm estilo visual diferenciado
        const poorlyStyledDisabled = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button[disabled], [disabled]'));
            return buttons
                .filter(el => {
                const style = window.getComputedStyle(el);
                const opacity = parseFloat(style.opacity);
                const color = style.color;
                // Disabled deve ter opacity < 1 ou cor acinzentada
                return opacity >= 1 && !color.includes('gray') && !color.includes('128');
            })
                .map(el => ({
                text: el.textContent?.trim(),
                class: el.className,
            }))
                .slice(0, 5);
        });
        if (poorlyStyledDisabled.length > 0) {
            bugs.push({
                id: `${checkId}-poor-disabled-style`,
                checkId,
                severity: 'LOW',
                title: `${poorlyStyledDisabled.length} botões disabled sem estilo visual claro`,
                description: JSON.stringify(poorlyStyledDisabled, null, 2),
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
            severity: 'MEDIUM',
            title: 'Exceção ao validar disabled states',
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
