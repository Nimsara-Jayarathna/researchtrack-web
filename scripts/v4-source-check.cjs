#!/usr/bin/env node
/* Offline safety net: source assertions only. Run `npm run ci` for actual type/lint/unit/build verification. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let count = 0;
function check(file, required, forbidden = []) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of required) {
    if (!source.includes(match)) throw new Error(`Expected ${JSON.stringify(match)} in ${file}`);
    count += 1;
  }
  for (const match of forbidden) {
    if (source.includes(match)) throw new Error(`Unexpected ${JSON.stringify(match)} in ${file}`);
    count += 1;
  }
}
check('src/components/ui/TopBar.tsx', ['bg-sky-50 text-sky-800', 'aria-current=', 'Open account menu', 'Open navigation menu'], ['bg-slate-900 text-white']);
check('src/features/projects/components/ProjectsPageView.tsx', [
  'Array.from({ length: 3 }', 'hidden min-w-0 xl:block', 'hidden min-w-0 2xl:block',
  'Loading projects', 'Updating projects', 'isLoading && items.length === 0', 'aria-busy={isLoading}',
], ['skeletonCount = 4']);
check('src/features/supervisor/components/SupervisorProjectCard.tsx', [
  'projectDateLabel', '<ProgressMeter', 'if (project.lifecycleStatus === "COMPLETED") return null',
  'Summary API does not include milestone completion state', 'Open project',
], ['Delivery signal', 'project.progressPercent}%`']);
check('src/features/student/components/StudentProjectCard.tsx', ['projectDateLabel', '<ProgressMeter', 'supervisorName', 'semester', 'activityLabel'], ['progressValue']);
check('src/components/ui/ProjectHeroCard.tsx', ['subtitle.trim().toLowerCase() !== title.trim().toLowerCase()', 'sm:px-5 sm:py-4']);
for (const role of ['student','supervisor']) {
  check(`src/features/${role}/components/projectDetails/${role === 'student' ? 'Student' : 'Supervisor'}ProjectDetailsKpis.tsx`, [
    'grid-cols-2 gap-2 lg:grid-cols-4', '<ProgressMeter', 'milestonesCount',
  ], ['{ label: "Progress", value:']);
}
check('src/features/projects/utils/projectDateLabel.ts', ['parseLocalDateOnly', 'readableDate.format']);
check('src/features/supervisor/components/SupervisorProjectCardSkeleton.tsx', ['aria-hidden="true"', 'motion-reduce:animate-none']);
check('src/features/student/components/StudentProjectCardSkeleton.tsx', ['aria-hidden="true"', 'motion-reduce:animate-none']);
console.log(`PASS: ${count} offline ResearchTrack V4 source invariants (not runtime or build verification).`);
