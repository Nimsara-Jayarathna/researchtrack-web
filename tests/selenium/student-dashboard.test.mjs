import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import { createServer } from "vite";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const projects = [
  {
    id: "project-1",
    title: "ResearchTrack Platform",
    summary: "A supervision workspace for university research projects.",
    lifecycleStatus: "ACTIVE",
    batch: "2026",
    semester: "Semester 1",
    milestoneDate: "2026-09-30",
    lastActivityAt: "2026-09-02T09:00:00Z",
    progressPercent: 65,
    memberCount: 4,
    supervisorName: "Dr. Maya Perera",
  },
  {
    id: "project-2",
    title: "Compiler Insights",
    summary: "Static analysis for safer student code.",
    lifecycleStatus: "PLANNING",
    batch: "2025",
    semester: "Semester 2",
    milestoneDate: null,
    lastActivityAt: null,
    progressPercent: 20,
    memberCount: 3,
    supervisorName: "Dr. Arun Silva",
  },
];

const projectDetail = {
  ...projects[0],
  supervisor: {
    id: "supervisor-1",
    firstName: "Maya",
    lastName: "Perera",
    email: "maya@example.test",
    registrationNumber: null,
  },
  leader: {
    id: "student-1",
    firstName: "Nimal",
    lastName: "Fernando",
    email: "nimal@example.test",
    registrationNumber: "IT20000001",
  },
  members: [
    {
      id: "student-1",
      firstName: "Nimal",
      lastName: "Fernando",
      email: "nimal@example.test",
      registrationNumber: "IT20000001",
      memberRole: "STUDENT",
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      title: "Final demonstration",
      description: "Present the completed research project.",
      dueDate: "2026-09-30",
      status: "IN_PROGRESS",
      sequenceNo: 1,
    },
  ],
};

const mockApiScript = `
(() => {
  const originalFetch = window.fetch.bind(window);
  const routes = ${JSON.stringify({
    "/api/v1/auth/me": {
      user: {
        id: "student-1",
        email: "nimal@example.test",
        role: "STUDENT",
        firstName: "Nimal",
        lastName: "Fernando",
      },
    },
    "/api/v1/projects": projects,
    "/api/v1/projects/project-1": projectDetail,
    "/api/student/projects/project-1/meeting-channels": [],
    "/api/student/projects/project-1/meeting-records": [],
  })};

  window.__seleniumApiCalls = [];
  window.fetch = async (input, init) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    const url = new URL(requestUrl, window.location.origin);
    window.__seleniumApiCalls.push({
      method: init?.method ?? (typeof input === "string" ? "GET" : input.method),
      path: url.pathname,
    });

    if (Object.prototype.hasOwnProperty.call(routes, url.pathname)) {
      return new Response(
        JSON.stringify({
          success: true,
          data: routes[url.pathname],
          meta: {
            timestamp: "2026-09-03T00:00:00Z",
            traceId: "selenium-student-dashboard",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };
})();
`;

let appServer;
let appUrl;
let driver;

async function visible(locator) {
  const element = await driver.wait(until.elementLocated(locator), 10_000);
  await driver.wait(until.elementIsVisible(element), 10_000);
  return element;
}

async function projectCard(projectId) {
  return visible(By.css(`a[href="/student/projects/${projectId}"]`));
}

before(async () => {
  appServer = await createServer({
    root: projectRoot,
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
    },
  });
  await appServer.listen();
  appUrl = appServer.resolvedUrls.local[0].replace(/\/$/, "");

  const options = new chrome.Options()
    .addArguments("--headless=new")
    .addArguments("--window-size=1440,1000")
    .addArguments("--disable-dev-shm-usage")
    .addArguments("--no-sandbox");

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
  await driver.sendDevToolsCommand("Page.addScriptToEvaluateOnNewDocument", {
    source: mockApiScript,
  });
});

after(async () => {
  await driver?.quit();
  await appServer?.close();
});

test(
  "US-107 student can view, search, clear, and open an assigned project",
  { timeout: 60_000 },
  async () => {
    await driver.get(`${appUrl}/student/projects`);

    const heading = await visible(By.css("h1"));
    assert.equal(await heading.getText(), "My Projects");

    await projectCard("project-1");
    await projectCard("project-2");
    assert.equal(
      (await driver.findElements(By.xpath("//a[contains(., 'New Project')]")))
        .length,
      0,
      "students must not receive a create-project action",
    );

    const search = await visible(
      By.css('input[aria-label="Search your projects"]'),
    );
    await search.sendKeys("compiler");
    await projectCard("project-2");
    await driver.wait(
      async () =>
        (
          await driver.findElements(
            By.css('a[href="/student/projects/project-1"]'),
          )
        ).length === 0,
      10_000,
    );

    await search.sendKeys(Key.chord(Key.CONTROL, "a"), "not assigned");
    assert.equal(
      await (
        await visible(By.xpath("//*[normalize-space(.)='No projects found']"))
      ).getText(),
      "No projects found",
    );

    const clearSearch = await visible(
      By.xpath("//button[normalize-space(.)='Clear search']"),
    );
    await clearSearch.click();
    const firstProject = await projectCard("project-1");
    await firstProject.click();

    await driver.wait(
      until.urlMatches(/\/student\/projects\/project-1$/),
      10_000,
    );
    const detailHeading = await visible(By.css("h1"));
    assert.equal(await detailHeading.getText(), "ResearchTrack Platform");

    for (const tab of [
      "Overview",
      "Team",
      "Milestones",
      "Files",
      "Github",
      "Jira",
      "Meetings",
    ]) {
      await visible(By.xpath(`//button[normalize-space(.)='${tab}']`));
    }

    const apiCalls = await driver.executeScript(
      "return window.__seleniumApiCalls",
    );
    assert.ok(
      apiCalls.some(
        ({ path: requestPath }) => requestPath === "/api/v1/projects",
      ),
      "the dashboard must request the assigned-project collection",
    );
    assert.ok(
      apiCalls.some(
        ({ path: requestPath }) => requestPath === "/api/v1/projects/project-1",
      ),
      "opening a card must request the selected project",
    );
  },
);
