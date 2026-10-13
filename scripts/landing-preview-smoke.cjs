/** A deliberately dependency-light rendering smoke test for the marketing
 * components, usable when npm cannot reach the package registry.
 * This is NOT a substitute for React/Vitest tests or a browser build. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
const Fragment = Symbol("fragment");
const node = (type, props) => ({ type, props: props ?? {} });
const runtime = { jsx: node, jsxs: node, Fragment };
const icon = (name) => () => node("svg", { "data-icon": name });

function getModule(relative) {
  if (relative === "react/jsx-runtime") return runtime;
  if (relative === "@/components/brand/Logo") return { LogoMark: ({ size }) => node("img", { src: "/logo.png", width: size }) };
  if (relative === "@/components/ui/Button") return { Button: ({ children }) => node("button", { children }) };
  if (relative === "lucide-react") return new Proxy({}, { get: (_, name) => icon(String(name)) });
  throw Error(`Unexpected external dependency in preview module: ${relative}`);
}
function load(file) {
  const abs = path.resolve(file);
  if (cache.has(abs)) return cache.get(abs).exports;
  const mod = { exports: {} };
  cache.set(abs, mod);
  const code = ts.transpileModule(fs.readFileSync(abs, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const resolve = (name) => name.startsWith("./") ? load(path.resolve(path.dirname(abs), name) + ".tsx") : getModule(name);
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { Symbol }, { filename: abs })(resolve, mod, mod.exports);
  return mod.exports;
}
function flatten(element, strings = [], tags = []) {
  if (element === null || element === undefined || typeof element === "boolean") return { strings, tags };
  if (Array.isArray(element)) { element.forEach(x => flatten(x, strings, tags)); return { strings, tags }; }
  if (typeof element === "string" || typeof element === "number") { strings.push(String(element)); return { strings, tags }; }
  if (typeof element.type === "function") return flatten(element.type(element.props), strings, tags);
  if (typeof element.type === "string") tags.push(element.type);
  return flatten(element.props.children, strings, tags);
}
const base = path.join(root, "src/features/landing/components");
const test = (file, name, props, phrases) => {
  const View = load(path.join(base, file + ".tsx"))[name];
  const tree = View(props);
  const { strings, tags } = flatten(tree);
  const output = strings.join(" ");
  for (const phrase of phrases) assert(output.includes(phrase), `${name}: missing ${phrase}`);
  assert(tags.length > 10, `${name}: unexpectedly empty output`);
  return tags.length;
};
let checks = 0;
checks += test("BrandConstellation", "BrandConstellation", {}, ["GitHub activity", "Jira insights", "Milestones", "Submission reviews"]);
checks += test("HeroSection", "HeroSection", { onRegister() {} }, ["One workspace.", "Complete visibility", "Get started"]);
checks += test("ProductPreview", "ProductPreview", {}, ["Supervisor Dashboard", "Project health", "Jira at risk", "Jira behind", "Projects needing attention"]);
checks += test("ProjectJourneyPreview", "ProjectJourneyPreview", {}, ["Project Horizon", "GitHub", "Jira", "Meeting records", "Research submissions"]);
for (const [stage, phrase] of [["plan", "Create research project"], ["connect", "Connected project activity"], ["collaborate", "Meeting records"], ["review", "Research Submissions"]]) {
  checks += test("WorkflowAppSnapshot", "WorkflowAppSnapshot", { stage }, [phrase, "Fictional sample data"]);
}
checks += test("WorkflowShowcaseSection", "WorkflowShowcaseSection", {}, ["PLAN", "CONNECT", "COLLABORATE", "REVIEW"]);
assert(fs.existsSync(path.join(root, "public/logo.png")), "Brand logo asset missing");
console.log(`PASS: 9 independently transpiled and executed TSX preview trees, ${checks} rendered elements, real logo asset present`);
console.log("NOTE: This verifies static component execution, not React lifecycle, layout, browser rendering, or network integration.");
