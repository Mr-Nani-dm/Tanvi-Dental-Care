/** Only repository-owned raster files and the two approved doctor portraits. */
export function isApprovedArticleImage(path: string) {
  return /^\/images\/blog\/[a-z0-9][a-z0-9-]*\.(?:webp|jpg|png)$/.test(path)
    || /^\/images\/content\/\d{4}\/(?:0[1-9]|1[0-2])\/[a-z0-9][a-z0-9-]*\.webp$/.test(path)
    || /^\/images\/doctors\/(?:naga-swathi|prathap-naidu)\.webp$/.test(path);
}
