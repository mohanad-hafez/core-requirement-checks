"use strict";
function urls(body) {
  return [...body.matchAll(/https?:\/\/[^\s<>"`]+/g)].map(m => m[0].replace(/[),.;]+$/, "")).flatMap(raw => { try { return [new URL(raw)]; } catch { return []; } });
}
function linkVerdict(pkg, body) {
  const repo = new URL(pkg.repo_url);
  const found = urls(body).some(url => {
    if (url.hostname !== repo.hostname) return false;
    if (pkg.old_version === null) {
      const path = repo.pathname.replace(/\/$/, "");
      return url.pathname === path || url.pathname.startsWith(path + "/");
    }
    const text = decodeURIComponent(url.href);
    const contains = version => {
      const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("(?<![0-9])" + escaped + "(?![0-9])").test(text);
    };
    return contains(pkg.old_version) && contains(pkg.new_version);
  });
  return { status: found ? "pass" : "fail", icon: found ? "✅" : "❌" };
}
function publicVerdict(repoUrl, observed) {
  if (observed.status >= 400 || new URL(observed.final_url).pathname.startsWith("/login")) return { status: "fail", icon: "❌" };
  if (observed.status === 200 && observed.public_metadata === true && new URL(observed.final_url).hostname === new URL(repoUrl).hostname) return { status: "pass", icon: "✅" };
  return { status: "warn", icon: "⚠️" };
}
module.exports = { urls, linkVerdict, publicVerdict };
