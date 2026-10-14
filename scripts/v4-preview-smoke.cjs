/** Execute V4 presentational components against a minimal JSX runtime without React dependencies.
 * Checks visible text and data paths. Not a browser, hook, build, or accessibility test. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const Fragment = Symbol('fragment');
const node = (type, props) => ({ type, props: props ?? {} });
const runtime = { jsx: node, jsxs: node, Fragment };
const icon = () => () => node('svg', {});
const mocks = {
  'react/jsx-runtime': runtime,
  'lucide-react': new Proxy({}, { get: icon }),
  'react-router-dom': { Link: ({ children, ...rest }) => node('a', { ...rest, children }) },
  '@/components/ui/StatusBadge': { StatusBadge: ({ children }) => node('span', { children }) },
  '@/components/ui/ProgressMeter': { ProgressMeter: ({ value }) => node('div', { role: 'progressbar', children: value == null ? 'Not reported' : `${value}%` }) },
  '@/components/ui/PageHeader': { PageHeader: ({ title }) => node('h1', { children: title }) },
  '@/components/feedback/EmptyState': { EmptyState: ({ title }) => node('section', { children: title }) },
  '@/components/feedback/ErrorState': { ErrorState: () => node('p', { children: 'Error loading' }) },
  '@/components/ui/Button': { buttonStyles: () => 'button' },
  '@/components/ui/Select': { Select: ({ children }) => node('select', { children }) },
};
function modulePath(name, file) {
  const base = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(file), name);
  for (const ext of ['.tsx', '.ts']) if (fs.existsSync(base + ext)) return base + ext;
  throw Error(`Missing source dependency: ${name} from ${file}`);
}
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = name => mocks[name] || load(modulePath(name, file));
  vm.runInNewContext(`(function(require,module,exports){${output}\n})`, { console, Date, Intl, Symbol, Math, Number, String }, { filename: file })(localRequire, mod, mod.exports);
  return mod.exports;
}
function flatten(element, strings = [], tags = []) {
  if (element == null || typeof element === 'boolean') return { strings, tags };
  if (Array.isArray(element)) { element.forEach(n => flatten(n, strings, tags)); return { strings, tags }; }
  if (['string','number'].includes(typeof element)) { strings.push(String(element)); return { strings, tags }; }
  if (typeof element.type === 'function') return flatten(element.type(element.props), strings, tags);
  if (typeof element.type === 'string') tags.push(element.type);
  flatten(element.props?.children, strings, tags);
  return { strings, tags };
}
function check(file, exportName, props, expected, forbidden = []) {
  const fn = load(path.join(root, 'src', file))[exportName];
  assert.equal(typeof fn, 'function', exportName);
  const tree = fn(props);
  const data = flatten(tree);
  const text = data.strings.join(' ');
  for (const s of expected) assert(text.includes(s), `${exportName}: ${s} missing from ${text}`);
  for (const s of forbidden) assert(!text.includes(s), `${exportName}: unexpected ${s} in ${text}`);
  assert(data.tags.length > 4, `${exportName}: tree unexpectedly empty`);
  return data.tags.length;
}
let elements = 0;
const supervisor = { id:'p1', title:'Project C', summary:'Research work', lifecycleStatus:'PLANNING', batch:'2026', semester:'Semester 2', milestoneDate:'2099-10-02', memberCount:3, progressPercent:25 };
elements += check('features/supervisor/components/SupervisorProjectCard.tsx', 'SupervisorProjectCard', { project:supervisor }, ['Project C','3','members','25%','Batch 2026'], ['Delivery signal']);
elements += check('features/student/components/StudentProjectCard.tsx', 'StudentProjectCard', { project:{ ...supervisor, status:'ACTIVE', supervisorName:'Dr. Example', lastActivityAt:null } }, ['Project C','Dr. Example','25%','No activity yet']);
elements += check('features/supervisor/components/projectDetails/SupervisorProjectDetailsKpis.tsx', 'SupervisorProjectDetailsKpis', { batch:'2027',semester:'Semester 2',milestonesCount:4,progressPercent:25 }, ['2027','Semester 2','4','25%']);
elements += check('features/student/components/projectDetails/StudentProjectDetailsKpis.tsx', 'StudentProjectDetailsKpis', { batch:'2027',semester:'Semester 2',milestonesCount:4,progressPercent:25 }, ['2027','Semester 2','4','25%']);
elements += check('components/ui/ProjectHeroCard.tsx','ProjectHeroCard',{title:'Research 1',subtitle:'Research 1',rightSlot:node('b',{children:'Planning'}),kpiSlot:node('span',{children:'Project facts'})},['Research 1','Planning','Project facts']);
elements += check('features/projects/components/ProjectsPageView.tsx','ProjectsPageView',{
  title:'Projects',subtitle:'All research',searchValue:'',onSearchChange(){},searchPlaceholder:'Search',
  error:null,onRetry(){},items:[],isLoading:true,emptyState:{title:'Empty',description:'None'},
  renderSkeleton:i=>node('article',{children:`Loading card ${i+1}`}), renderItem:p=>node('article',{children:p}),
}, ['Loading projects','Loading card 1','Loading card 2','Loading card 3']);
elements += check('features/projects/components/ProjectsPageView.tsx','ProjectsPageView',{
  title:'Projects',subtitle:'All research',searchValue:'',onSearchChange(){},searchPlaceholder:'Search',
  error:null,onRetry(){},items:['Project C'],isLoading:true,emptyState:{title:'Empty',description:'None'},
  renderSkeleton:i=>node('article',{children:`Loading card ${i+1}`}), renderItem:p=>node('article',{children:p}),
}, ['Updating projects','Project C'], ['Loading card 1']);
console.log(`PASS: 7 V4 JSX trees executed with mocked dependencies (${elements} rendered elements).`);
console.log('NOTE: simulated JSX execution only, not React/Vitest/browser/build verification.');
