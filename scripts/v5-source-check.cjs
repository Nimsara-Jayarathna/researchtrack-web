/** Offline V5 structural invariants. This does not replace TypeScript, Vitest or a browser build. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = [
 'src/app/layout/AppShell.tsx',
 'src/components/ui/TopBar.tsx',
 'src/components/ui/DashboardStatCard.tsx',
 'src/features/supervisor/components/dashboard/DashboardStatCard.tsx',
 'src/features/supervisor/components/dashboard/DashboardStatsSection.tsx',
 'src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx',
 'src/features/supervisor/components/dashboard/DashboardSearchInput.tsx',
 'src/features/landing/components/HeroSection.tsx',
 'src/features/landing/components/AppPreviewUI.tsx',
 'src/features/landing/components/ProductPreview.tsx',
 'src/features/supervisor/components/dashboard/DashboardLayoutV5.test.tsx',
];
let checks=0;
const check=(ok, why)=>{ checks++; assert(ok, why); };
for(const file of files){
 const source=ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 check(source.parseDiagnostics.length===0, `Syntax errors in ${file}: ${source.parseDiagnostics.length}`);
}
check(read('src/app/layout/AppShell.tsx').includes('max-w-[1600px]'), 'Actual workspace must use wider bounded desktop layout');
check(read('src/components/ui/TopBar.tsx').includes('max-w-[1600px]'), 'Private topbar must align with content width');
check(read('src/components/ui/TopBar.tsx').includes('bg-sky-50 text-sky-800'), 'Soft-blue active navigation preserved');
check(read('src/features/supervisor/components/dashboard/DashboardStatsSection.tsx').includes('2xl:grid-cols-7'), 'All metrics must share a row at 2XL');
check(read('src/features/supervisor/components/dashboard/DashboardStatsSection.tsx').includes('upcoming counts exclude overdue'), 'Deadline/lifecycle explanation missing');
check(read('src/features/supervisor/components/dashboard/DashboardStatsSection.tsx').includes('"neutral"'), 'Not linked metrics should not imply a Jira incident');
check(read('src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx').includes('xl:block'), 'Wide table needs its own breakpoint');
check(read('src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx').includes('xl:hidden'), 'Responsive mobile cards must remain available');
check(read('src/features/landing/components/ProductPreview.tsx').includes('@/components/ui/DashboardStatCard'), 'Live and marketing metric presentation must share one component');
check(read('src/features/landing/components/ProductPreview.tsx').includes('marketing-portfolio-metrics'), 'Preview metric layout missing');
check(read('src/features/landing/components/ProductPreview.tsx').includes('<span>Members</span>'), 'Marketing project rows need real table fields');
check(read('src/features/landing/components/HeroSection.tsx').includes('mt-4 inline-flex'), 'Callout should no longer overlay the preview search field');
check(!read('src/features/landing/components/HeroSection.tsx').includes('top-[13%]'), 'Overlay obscures preview search field');
check(read('src/features/landing/components/AppPreviewUI.tsx').includes('Supervisor</span>'), 'Preview must include supervisor role as in real header');
check(read('src/components/ui/DashboardStatCard.tsx').includes('preview = false'), 'Shared metric card preview variant missing');
check(read('src/features/supervisor/components/dashboard/DashboardStatCard.tsx').includes('Compatibility re-export'), 'Existing import paths must remain compatible');
console.log(`PASS: ${checks} V5 design-integration invariants. Offline source checks only.`);
