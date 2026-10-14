#!/usr/bin/env node
/* Offline structural regression checks. These are NOT substitutes for Vitest, lint or browser QA. */
const fs = require('node:fs');
const path = require('node:path');
let ts;
try { ts = require('typescript'); } catch { ts = null; }
const root = path.resolve(__dirname, '..');
let checks = 0;
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(file, fragments) {
  const content = read(file);
  for (const fragment of fragments) {
    if (!content.includes(fragment)) throw new Error(`${file}: missing ${fragment}`);
    checks++;
  }
}
try {
  assert('src/app/layout/AppShell.tsx', ['workspace-shell', '<TopBar', '{children}']);
  assert('src/styles/workspace.css', ['.workspace-shell', '.workspace-table', 'prefers-reduced-motion', 'focus-visible']);
  assert('src/index.css', ['styles/workspace.css', 'styles/globals.css']);
  assert('src/features/supervisor/pages/SupervisorDashboardPage.tsx', [
    'DashboardStatsSection', 'DashboardProjectHealthSection', 'DashboardAttentionSection',
    'DashboardUpcomingMilestonesSection', 'onStatusFilterChange={viewModel.setStatusFilter}',
    'onSortModeChange={viewModel.setSortMode}', 'hasConfiguredMilestones',
  ]);
  assert('src/features/supervisor/hooks/dashboard/useSupervisorDashboardViewModel.ts', [
    'setStatusFilter', 'setSortMode', 'sortMode === "risk"', 'sortMode === "progress"', 'setCurrentPage(1)',
  ]);
  assert('src/features/supervisor/components/dashboard/DashboardStatsSection.tsx', [
    'DASHBOARD_STATS.slice(0, 4)', 'DASHBOARD_STATS.slice(4)', 'jiraMetricsUnavailable', 'Not linked',
  ]);
  assert('src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx', [
    '<ProgressMeter', 'dashboard-lifecycle-filter', 'dashboard-sort', 'totalPages > 1',
    'No research projects yet', 'No projects found', '/supervisor/projects/',
  ]);
  assert('src/components/ui/ProgressMeter.tsx', ['aria-valuenow', 'Not reported', 'Math.min(100', 'Reported progress']);
  assert('src/features/supervisor/components/dashboard/DashboardAttentionSection.tsx', ['item.reasons', 'WorkspaceNotice', 'Open project']);
  assert('src/features/supervisor/components/dashboard/DashboardUpcomingMilestonesSection.tsx', ['hasConfiguredMilestones', 'No milestones configured', 'No deadlines in the next two weeks']);
  assert('src/features/student/components/StudentProjectCard.tsx', ['ProgressMeter', '/student/projects/']);
  assert('src/features/supervisor/components/SupervisorProjectCard.tsx', ['ProgressMeter', '/supervisor/projects/']);
  assert('src/components/ui/PageTabs.tsx', ['onChange(item.value)', 'aria-selected', 'role="tablist"']);
  const changed = [
    'src/components/ui/ProgressMeter.tsx', 'src/components/ui/WorkspaceNotice.tsx',
    'src/features/supervisor/components/dashboard/DashboardStatCard.tsx',
    'src/features/supervisor/components/dashboard/DashboardStatsSection.tsx',
    'src/features/supervisor/components/dashboard/DashboardProjectHealthSection.tsx',
    'src/features/supervisor/components/dashboard/DashboardAttentionSection.tsx',
    'src/features/supervisor/components/dashboard/DashboardUpcomingMilestonesSection.tsx',
    'src/features/supervisor/hooks/dashboard/useSupervisorDashboardViewModel.ts',
    'src/features/projects/components/ProjectsPageView.tsx',
    'src/features/supervisor/pages/SupervisorDashboardPage.tsx',
  ];
  for (const file of changed) {
    if (!ts) break;
    const result = ts.transpileModule(read(file), { fileName:file, reportDiagnostics:true,
      compilerOptions: { module:ts.ModuleKind.ESNext, jsx:ts.JsxEmit.ReactJSX, target:ts.ScriptTarget.ES2022 }});
    if (result.diagnostics.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error(`TSX parse failed: ${file}`);
    checks++;
  }
  console.log(`PASS: ${checks} offline workspace source assertions and TSX syntax probes.`);
  if (!ts) console.log('NOTE: TypeScript is not installed; TSX probes were skipped. Run npm ci first for those probes.');
  console.log('NOTE: no React runtime, TypeScript semantic, lint, browser or build verification included.');
} catch (error) {
  console.error('FAIL:', error.message); process.exitCode = 1;
}
