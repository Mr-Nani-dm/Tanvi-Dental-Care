type GitHubFileResponse = {
  sha: string;
  content: string;
  encoding: string;
};

function config() {
  const repository = process.env.GITHUB_CONTENT_REPOSITORY || "Mr-Nani-dm/Tanvi-Dental-Care";
  const branch = process.env.GITHUB_CONTENT_BRANCH || "main";
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

export async function readRepoFile(path: string) {
  const { repository, branch, token } = config();
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}?ref=${encodeURIComponent(branch)}`, {
    headers: headers(token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Unable to read ${path} from GitHub (${response.status}).`);
  const file = (await response.json()) as GitHubFileResponse;
  const decoded = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { content: decoded, sha: file.sha };
}

export async function readRepoJson<T>(path: string) {
  const file = await readRepoFile(path);
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
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `Unable to write ${path} to GitHub (${response.status}).`);
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
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `Unable to upload ${path} to GitHub (${response.status}).`);
  }
  return payload as { commit?: { sha?: string }; content?: { sha?: string } };
}
