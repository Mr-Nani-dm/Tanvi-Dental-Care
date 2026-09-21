type GitHubFileResponse = {
  sha: string;
  content: string;
  encoding: string;
};

export class GitHubContentError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Preview deployments must never inherit the production content branch.
export function contentBranch() {
  if (process.env.VERCEL_ENV === "preview") {
    const branch = process.env.VERCEL_GIT_COMMIT_REF;
    if (!branch || branch === "main" || branch === "master") throw new Error("A separate preview content branch is required.");
    if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_OWNER !== "Mr-Nani-dm") throw new Error("Content writes from fork previews are disabled.");
    return branch;
  }
  if (process.env.VERCEL_ENV === "production") return process.env.GITHUB_CONTENT_BRANCH || "main";
  const localBranch = process.env.GITHUB_CONTENT_BRANCH;
  if (!localBranch || localBranch === "main" || localBranch === "master") throw new Error("Set GITHUB_CONTENT_BRANCH to a separate development branch.");
  return localBranch;
}

function config() {
  const repository = process.env.GITHUB_CONTENT_REPOSITORY || "Mr-Nani-dm/Tanvi-Dental-Care";
  const branch = contentBranch();
  const token = process.env.GITHUB_CONTENT_TOKEN || "";
  if (!token) throw new Error("GITHUB_CONTENT_TOKEN is not configured.");
  return { repository, branch, token };
}

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function readRepoFile(path: string, ref?: string) {
  const { repository, branch, token } = config();
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}?ref=${encodeURIComponent(ref || branch)}`, {
    headers: headers(token),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new GitHubContentError(`Unable to read content from GitHub (${response.status}).`, response.status);
  const file = (await response.json()) as GitHubFileResponse;
  const decoded = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { content: decoded, sha: file.sha };
}

export async function readRepoJson<T>(path: string, ref?: string) {
  const file = await readRepoFile(path, ref);
  return { value: JSON.parse(file.content) as T, sha: file.sha };
}

export async function writeRepoFile({ path, content, sha, message }: { path: string; content: string; sha?: string; message: string }) {
  const { repository, branch, token } = config();
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({
      message,
      branch,
      content: Buffer.from(content, "utf8").toString("base64"),
      ...(sha ? { sha } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new GitHubContentError(`Unable to write content to GitHub (${response.status}).`, response.status);
  }
  return payload as { commit?: { sha?: string }; content?: { sha?: string } };
}

export async function writeRepoBinary({ path, bytes, message }: { path: string; bytes: Uint8Array; message: string }) {
  const { repository, branch, token } = config();
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify({
      message,
      branch,
      content: Buffer.from(bytes).toString("base64"),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new GitHubContentError(`Unable to upload an image to GitHub (${response.status}).`, response.status);
  }
  return payload as { commit?: { sha?: string }; content?: { sha?: string } };
}

async function gitRequest(path: string, method = "GET", body?: unknown): Promise<any> {
  const { repository, token } = config();
  const response = await fetch(`https://api.github.com/repos/${repository}/git/${path}`, {
    method, headers: headers(token), cache: "no-store", signal: AbortSignal.timeout(15_000),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new GitHubContentError(`GitHub transaction failed (${response.status}). Please retry.`, response.status);
  return response.json();
}

export async function repositoryHead(): Promise<{ sha: string; tree: string }> {
  const ref = await gitRequest(`ref/heads/${encodeURIComponent(contentBranch())}`);
  const commit = await gitRequest(`commits/${ref.object.sha}`);
  return { sha: ref.object.sha, tree: commit.tree.sha };
}

// One fast-forward ref update publishes both history and the Blog Manager draft.
// A competing write rejects the transaction; no partial handoff is possible.
export async function commitRepoFiles(head: { sha: string; tree: string }, files: { path: string; content: string }[], message: string) {
  const tree = await gitRequest("trees", "POST", { base_tree: head.tree, tree: files.map(file => ({ ...file, mode: "100644", type: "blob" })) });
  const commit = await gitRequest("commits", "POST", { message, tree: tree.sha, parents: [head.sha] });
  await gitRequest(`refs/heads/${encodeURIComponent(contentBranch())}`, "PATCH", { sha: commit.sha, force: false });
  return { sha: commit.sha as string };
}
