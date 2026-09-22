import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const specPath = "docs/FUNCTIONAL_SPEC.md";
const start = "<!-- AUTO-FUNCTIONAL-SPEC-START -->";
const end = "<!-- AUTO-FUNCTIONAL-SPEC-END -->";

const run = (command) => {
  try { return execSync(command, { encoding: "utf8" }).trim(); }
  catch { return ""; }
};

const commit = run("git rev-parse HEAD") || "unknown";
const date = new Date().toISOString();
const previous = run("git rev-parse HEAD^");
const diff = previous
  ? run(`git diff --name-status ${previous} ${commit}`)
  : run(`git show --pretty="" --name-status ${commit}`);

const rows = diff
  .split("\n")
  .filter(Boolean)
  .slice(0, 250)
  .map((line) => {
    const [status, ...parts] = line.split("\t");
    return `- \`${status}\` \`${parts.join("\t")}\``;
  });

const snapshot = [
  start,
  "### Automated repository change snapshot",
  "",
  `- Last synchronisation: ${date}`,
  `- Commit: \`${commit}\``,
  `- Trigger: ${process.env.GITHUB_EVENT_NAME || "local"}`,
  "",
  rows.length ? rows.join("\n") : "- No repository file changes detected since the previous commit.",
  "",
  "> This block is maintained automatically from Git history. It records added, modified and deleted files so documentation does not silently drift. It does not invent feature descriptions: meaningful behavioural, data-model, permission and visual changes should still update the affected specification sections in the same change.",
  end,
].join("\n");

const current = readFileSync(specPath, "utf8");
const pattern = new RegExp(`\\n?${start.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}.*?${end.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\n?`, "s");

const next = pattern.test(current)
  ? current.replace(pattern, `\\n${snapshot}\\n`)
  : `${current.trimEnd()}\\n\\n${snapshot}\\n`;

writeFileSync(specPath, next);
