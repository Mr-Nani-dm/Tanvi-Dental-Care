const { execFileSync } = require("node:child_process");
// History and quota JSON are read from GitHub at request time. They do not need
// a new website build. Compare to the last deployed commit, not just HEAD^, so
// failed or skipped code builds cannot be hidden behind a later storage commit.
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
if (!previous || !/^[a-f0-9]{40}$/.test(previous)) process.exit(1);
try {
  const changed = execFileSync("git", ["diff", "--name-only", previous, "HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const storage = new Set(["src/content/content-os-data.json", "src/content/content-os-usage.json"]);
  process.exit(changed.length > 0 && changed.every(path => storage.has(path)) ? 0 : 1);
} catch { process.exit(1); }
