import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, cleanup } from '@testing-library/react';
import { Presentation, Box } from '../../../src/presentation-kit';
it('keeps distributable source free of visual defaults and CSS/framework imports', () => {
    const dir = resolve('src/presentation-kit');
    const files = readdirSync(dir, { recursive: true }).filter(path => typeof path === 'string' && /\.(tsx?|css)$/.test(path));
    for (const file of files) {
        expect(file).not.toMatch(/\.css$/);
        const source = readFileSync(resolve(dir, file.toString()), 'utf8');
        expect(source).not.toMatch(/import[^\n]*(?:\.css|tailwind)|#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(|fontFamily|fontSize|boxShadow|borderRadius|backgroundColor|className=["']/i);
    }
    const { container } = render(<Presentation steps={[{ id: 'one', era: 'one', title: 'One', caption: 'Caption', payload: undefined, Scene: () => <Box id="one"/> }]}/>);
    for (const element of container.querySelectorAll<HTMLElement>('[style]'))
        for (const property of ['color', 'background', 'fontFamily', 'fontSize', 'border', 'borderRadius', 'boxShadow', 'margin', 'padding'])
            expect(element.style[property as 'color']).toBe('');
    cleanup();
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ')).not.toMatch(/tailwind/);
});
