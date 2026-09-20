/** Visible-word counting shared by server checks and the browser preview. */
export function visibleText(text: string) {
  return text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/https?:\/\/[^\s<>)]+/g, " ").replace(/<[^>]*>/g, " ").replace(/[#*_`~>|]/g, " ");
}

export function countWords(text: string) {
  return visibleText(text).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}
