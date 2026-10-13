/** Offline structural checks for the public marketing layer.
 * This supplements, but does NOT replace, TypeScript, ESLint, Vitest or Vite.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const read = (filename) => fs.readFileSync(path.join(root, filename), "utf8");
const paths = [
  "src/app/layout/PublicLayout.tsx",
  "src/components/ui/Button.tsx",
  "src/features/landing/pages/LandingPage.tsx",
  "src/features/landing/pages/LandingPage.test.tsx",
  "src/features/landing/components/LandingHeader.tsx",
  "src/features/landing/components/LandingHeader.test.tsx",
  "src/features/landing/components/HeroSection.tsx",
  "src/features/landing/components/BrandConstellation.tsx",
  "src/features/landing/components/AppPreviewUI.tsx",
  "src/features/landing/components/WorkflowAppSnapshot.tsx",
  "src/features/landing/components/LandingProductVisuals.test.tsx",
  "src/features/landing/components/ProductPreview.tsx",
  "src/features/landing/components/ProjectJourneyPreview.tsx",
  "src/features/landing/components/ProductShowcaseSection.tsx",
  "src/features/landing/components/FeaturesSection.tsx",
  "src/features/landing/components/WorkflowShowcaseSection.tsx",
  "src/features/landing/components/HowItWorksSection.tsx",
  "src/features/landing/components/WhoItsForSection.tsx",
  "src/features/landing/components/TrustStrip.tsx",
  "src/features/landing/components/FinalCTASection.tsx",
  "src/features/legal/pages/SupportPage.tsx",
];
let checks = 0;
const assert = (condition, message) => {
  checks++;
  if (!condition) throw new Error(`FAILED: ${message}`);
};

for (const filename of paths) {
  const sf = ts.createSourceFile(filename, read(filename), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert(sf.parseDiagnostics.length === 0, `${filename}: ${sf.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, " ")).join("; ")}`);
}
const page = read("src/features/landing/pages/LandingPage.tsx");
const header = read("src/features/landing/components/LandingHeader.tsx");
const landing = [
  "src/features/landing/components/HeroSection.tsx",
  "src/features/landing/components/BrandConstellation.tsx",
  "src/features/landing/components/AppPreviewUI.tsx",
  "src/features/landing/components/WorkflowAppSnapshot.tsx",
  "src/features/landing/components/LandingProductVisuals.test.tsx",
  "src/features/landing/components/ProductShowcaseSection.tsx",
  "src/features/landing/components/FeaturesSection.tsx",
  "src/features/landing/components/WorkflowShowcaseSection.tsx",
  "src/features/landing/components/HowItWorksSection.tsx",
  "src/features/landing/components/WhoItsForSection.tsx",
  "src/features/landing/components/FinalCTASection.tsx",
].map(read).join("\n");

for (const component of ["HeroSection", "ProductShowcaseSection", "FeaturesSection", "WorkflowShowcaseSection", "HowItWorksSection", "WhoItsForSection", "TrustStrip", "FinalCTASection"]) {
  assert(page.includes(`<${component}`), `${component} must appear on the landing page`);
}
for (const id of ["platform", "features", "workflow", "audiences", "get-started"]) {
  assert(landing.includes(`id=\"${id}\"`), `missing real section target #${id}`);
  if (id !== "get-started") assert(header.includes(`#${id}`), `header nav missing #${id}`);
}
assert(page.includes("authApi.getRegisterConfig()"), "registration gate must remain");
assert(page.includes("<RegistrationPanel"), "registration UI must remain");
assert(page.includes("<LoginPanel"), "login UI must remain");
assert(page.includes("onRetry"), "register configuration error must remain retryable");
assert(header.includes("aria-expanded") && header.includes("aria-controls"), "mobile menu ARIA attributes required");
assert(read("src/features/landing/components/AppPreviewUI.tsx").includes("Fictional sample data"), "all previews must disclose illustrative data");
assert(read("src/features/landing/components/BrandConstellation.tsx").includes("LogoMark"), "hero animation must use the real ResearchTrack logo asset");
assert(read("src/features/landing/components/BrandConstellation.tsx").includes("landing-brand-signal"), "brand graphic needs linked capability labels");
assert(read("src/features/landing/components/HeroSection.tsx").includes("BrandConstellation"), "hero needs animated brand graphic");
assert(read("src/features/landing/components/ProductPreview.tsx").includes("Project health"), "product preview must reflect actual dashboard project health section");
assert(read("src/features/landing/components/ProductPreview.tsx").includes("Jira behind"), "product preview must represent actual 7-metric dashboard");
for (const stage of ['plan', 'connect', 'collaborate', 'review']) {
  assert(read('src/features/landing/components/WorkflowShowcaseSection.tsx').includes(`stage: "${stage}"`), `missing real workflow snapshot: ${stage}`);
}
assert(read('src/features/landing/components/WorkflowAppSnapshot.tsx').includes('PreviewWindow'), 'workflow views must use same app-inspired preview shell');
assert(read('src/features/landing/components/ProjectJourneyPreview.tsx').includes('PreviewTabs'), 'project preview must reflect actual project tabs');
assert(read('src/styles/globals.css').includes('.landing-brand-center'), 'marketing-only brand animation CSS missing');
assert(read("src/features/landing/components/FinalCTASection.tsx").includes('to="/legal/privacy"'), "privacy route required");
assert(read("src/features/landing/components/FinalCTASection.tsx").includes('to="/support"'), "support route required");
assert(!landing.includes("Students register their research project"), "incorrect student setup claim still present");
assert(!landing.includes("milestones align with development tasks automatically"), "unsupported automatic Jira alignment claim present");
assert(read("index.html").includes('name="description"'), "SEO description required");
assert(read("src/styles/globals.css").includes("prefers-reduced-motion"), "reduced-motion support required");

console.log(`PASS: ${checks} offline public source structure and TSX syntax checks`);
console.log("NOTE: This is not runtime, browser, TypeScript semantic, lint, or production-build verification.");
