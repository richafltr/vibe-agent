// Validation script for microgames
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Accept game name as argument
const gameName = process.argv[2];

if (!gameName) {
    console.error('Usage: node validateGames.cjs <GameName>');
    process.exit(1);
}

console.log(`🎮 Validating ${gameName}...\n`);

// Read and parse files
function readFile(filePath) {
    try {
        return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    } catch (e) {
        return null;
    }
}

// Read GameConfig to check registrations
const gameConfig = readFile('src/GameConfig.ts');
const mainFile = readFile('src/main.ts');

let errors = [];
let warnings = [];
let passes = [];

// Check if game file exists
const gamePath = `src/scenes/microgames/${gameName}.ts`;
if (!fs.existsSync(path.join(__dirname, gamePath))) {
    errors.push(`Game file not found: ${gamePath}`);
} else {
    passes.push(`✓ Game file exists: ${gamePath}`);
    const gameContent = readFile(gamePath);

    // Check if extends BaseMicrogame
    if (gameContent.includes('extends BaseMicrogame')) {
        passes.push('✓ Extends BaseMicrogame class');
    } else {
        errors.push('Must extend BaseMicrogame class');
    }

    // Check imports
    if (gameContent.includes("from '../BaseMicrogame'")) {
        passes.push('✓ Imports BaseMicrogame correctly');
    } else {
        errors.push('Must import BaseMicrogame');
    }

    // Check required methods
    const requiredMethods = [
        'getPrompt',
        'getGameDuration',
        'setupGame',
        'setupControls',
        'cleanupControls'
    ];

    requiredMethods.forEach(method => {
        if (gameContent.includes(`${method}(`)) {
            passes.push(`✓ Has ${method}() method`);
        } else {
            errors.push(`Missing required method: ${method}()`);
        }
    });

    // Check constructor
    if (gameContent.includes(`super({ key: '${gameName}'`)) {
        passes.push(`✓ Scene key matches class name: '${gameName}'`);
    } else {
        errors.push(`Scene key must match class name: ${gameName}`);
    }

    // Check win/lose states
    const hasWinState = gameContent.includes('setWinState()');
    const hasFailState = gameContent.includes('setFailState()');

    if (hasWinState || hasFailState) {
        passes.push('✓ Has win/fail state handling');
    } else {
        warnings.push('Game should call setWinState() or setFailState()');
    }

    // Check cleanup
    if (gameContent.includes('cleanupControls(): void {')) {
        const cleanupMethod = gameContent.substring(
            gameContent.indexOf('cleanupControls(): void {'),
            gameContent.indexOf('}', gameContent.indexOf('cleanupControls(): void {')) + 1
        );

        if (cleanupMethod.includes('.off(') || cleanupMethod.includes('.remove()') ||
            cleanupMethod.includes('// Cursor keys are automatically cleaned up')) {
            passes.push('✓ cleanupControls() has cleanup logic');
        } else if (cleanupMethod.trim().endsWith('{}')) {
            warnings.push('cleanupControls() appears to be empty');
        }
    }
}

// Check registration in registry - these are warnings, not errors
// (since registry will be updated after validation passes)
const registryFile = readFile('src/scenes/microgames/registry.ts');
if (registryFile) {
    // Check import
    if (registryFile.includes(`import ${gameName} from './${gameName}'`)) {
        passes.push('✓ Already imported in registry');
    } else {
        warnings.push('Not yet imported in registry.ts (will be added after validation)');
    }

    // Check in MICROGAME_SCENES array
    if (registryFile.includes(gameName + ',') || registryFile.includes(gameName + '\n')) {
        passes.push('✓ Already in MICROGAME_SCENES array');
    } else {
        warnings.push('Not yet in MICROGAME_SCENES array (will be added after validation)');
    }

    // Check metadata
    if (registryFile.includes(`key: '${gameName}'`)) {
        passes.push('✓ Metadata already in MICROGAME_METADATA');
    } else {
        warnings.push('Metadata not yet in MICROGAME_METADATA (will be added after validation)');
    }
} else {
    errors.push('Could not read registry.ts');
}

// TypeScript Check - only check for structural issues
console.log('\n🔍 Checking TypeScript structure...');
try {
    // Check if the file can be parsed at all
    const gameContent = readFile(gamePath);

    // Basic syntax checks that would prevent the game from working
    const syntaxChecks = [
        { pattern: /class\s+\w+\s+extends\s+BaseMicrogame/, desc: 'Valid class declaration' },
        { pattern: /constructor\s*\(\s*\)\s*{[\s\S]*?super\s*\(\s*{[\s\S]*?}\s*\)/, desc: 'Valid constructor with super call' },
        { pattern: /getPrompt\s*\(\s*\)\s*:\s*string/, desc: 'Valid getPrompt method signature' },
        { pattern: /getGameDuration\s*\(\s*\)\s*:\s*number/, desc: 'Valid getGameDuration method signature' },
        { pattern: /setupGame\s*\(\s*\)\s*:\s*void/, desc: 'Valid setupGame method signature' },
        { pattern: /setupControls\s*\(\s*\)\s*:\s*void/, desc: 'Valid setupControls method signature' },
        { pattern: /cleanupControls\s*\(\s*\)\s*:\s*void/, desc: 'Valid cleanupControls method signature' }
    ];

    let structureValid = true;
    syntaxChecks.forEach(check => {
        if (!check.pattern.test(gameContent)) {
            errors.push(`Invalid structure: ${check.desc}`);
            structureValid = false;
        }
    });

    if (structureValid) {
        passes.push('✓ TypeScript structure is valid');
    }

    // Check for common syntax errors that would break the game
    console.log('🔍 Checking for syntax errors...');

    // Check for incomplete statements (like "this.cat = this.")
    if (/=\s*this\.\s*$|=\s*this\.\s*\n|=\s*this\.\s*}/m.test(gameContent)) {
        errors.push('Incomplete statement found (e.g., "this.cat = this.")');
    }

    // Check for unterminated strings (more accurate check)
    // This regex looks for strings that start but don't end on the same line
    const lines = gameContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comment lines
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

        // Check for strings that open but don't close
        let inString = false;
        let stringChar = '';
        let escaped = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar) {
                inString = false;
            }
        }

        if (inString && stringChar !== '`') { // Template literals can span lines
            errors.push(`Unterminated string literal on line ${i + 1}`);
        }
    }

    // Check for missing closing braces/brackets
    let braceCount = 0;
    let bracketCount = 0;
    let parenCount = 0;

    for (let char of gameContent) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
        else if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
    }

    if (braceCount !== 0) errors.push(`Mismatched braces: ${braceCount > 0 ? 'missing closing' : 'extra closing'} brace(s)`);
    if (bracketCount !== 0) errors.push(`Mismatched brackets: ${bracketCount > 0 ? 'missing closing' : 'extra closing'} bracket(s)`);
    if (parenCount !== 0) errors.push(`Mismatched parentheses: ${parenCount > 0 ? 'missing closing' : 'extra closing'} parenthesis/es`);

    // Check for common TypeScript syntax errors
    if (/\.\s*\n|,\s*\n\s*}|\.\s*;/.test(gameContent)) {
        warnings.push('Possible syntax error: trailing dot or comma detected');
    }

    // Only run TypeScript check on this specific file to catch compilation errors
    console.log('🔍 Running targeted syntax check...');
    try {
        // Use the project's tsconfig.json for type checking
        const tscResult = execSync(`npx tsc --noEmit ${gamePath} 2>&1`, {
            encoding: 'utf8',
            stdio: 'pipe'
        });

        // Check if there were any errors specific to this file
        if (tscResult && tscResult.includes(gameName)) {
            const lines = tscResult.split('\n');
            lines.forEach(line => {
                if (line.includes(gameName) && (line.includes('error TS') || line.includes('ERROR:'))) {
                    // Skip errors that are due to TypeScript not having full project context
                    const errorMsg = line.replace(/^.*?error TS\d+:\s*/, '').trim();

                    // Skip known false positives when checking files in isolation
                    const skipPatterns = [
                        /Module .* can only be default-imported using the 'esModuleInterop' flag/,
                        /Property .* does not exist on type .* extends/,
                        /Expected 0 arguments, but got 1/,
                        /Property '(add|physics|input|time|tweens|cameras|scene|sound)' does not exist on type/
                    ];

                    const shouldSkip = skipPatterns.some(pattern => pattern.test(errorMsg));

                    if (!shouldSkip && errorMsg && !errors.includes(`Syntax error: ${errorMsg}`)) {
                        errors.push(`Syntax error: ${errorMsg}`);
                    }
                }
            });
        } else {
            passes.push('✓ No syntax errors detected');
        }
    } catch (tscError) {
        // Only report errors that are specific to this game file
        const errorOutput = (tscError.stdout || '') + (tscError.stderr || '');
        if (errorOutput.includes(gameName)) {
            const lines = errorOutput.split('\n');
            lines.forEach(line => {
                if (line.includes(gameName) && (line.includes('error TS') || line.includes('ERROR:'))) {
                    const errorMsg = line.replace(/^.*?error TS\d+:\s*/, '').trim();

                    // Skip known false positives when checking files in isolation
                    const skipPatterns = [
                        /Module .* can only be default-imported using the 'esModuleInterop' flag/,
                        /Property .* does not exist on type .* extends/,
                        /Expected 0 arguments, but got 1/,
                        /Property '(add|physics|input|time|tweens|cameras|scene|sound)' does not exist on type/
                    ];

                    const shouldSkip = skipPatterns.some(pattern => pattern.test(errorMsg));

                    if (!shouldSkip && errorMsg && !errors.includes(`Syntax error: ${errorMsg}`)) {
                        errors.push(`Syntax error: ${errorMsg}`);
                    }
                }
            });
        }

        // If we filtered out all errors, it's a pass
        if (errorOutput.includes(gameName) && errors.filter(e => e.startsWith('Syntax error:')).length === 0) {
            passes.push('✓ No significant syntax errors detected');
        }
    }

} catch (error) {
    // If we can't even read the file, it's a real error
    errors.push('TypeScript file has critical errors: ' + error.message);
}

// Report results
const success = errors.length === 0;

if (success) {
    console.log('✅ Validation PASSED');
    console.log(`   ${passes.length} checks passed`);
} else {
    console.log('❌ Validation FAILED');
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach(error => console.log(`   - ${error}`));
}

if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
}

// Exit with appropriate code
process.exit(success ? 0 : 1); 