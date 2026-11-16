export type LearningKind = "video" | "article" | "book" | "audio" | "link";

const ext = (url?: string | null) => (url || "").split("?")[0].split(".").pop()?.toLowerCase() || "";

/** Infer the content kind of an academic resource from its file/URL. */
export const kindOf = (resource: { file_url?: string | null; description?: string | null }): LearningKind => {
  const url = (resource.file_url || "").toLowerCase();
  const e = ext(url);
  if (/youtube|vimeo|youtu\.be/.test(url) || ["mp4", "mov", "webm", "mkv"].includes(e)) return "video";
  if (["mp3", "wav", "m4a", "ogg", "aac"].includes(e)) return "audio";
  if (["pdf", "epub"].includes(e)) return "book";
  if (["doc", "docx", "ppt", "pptx", "txt", "md"].includes(e)) return "article";
  if (url) return "link";
  return "article";
};

export const KIND_LABEL: Record<LearningKind, string> = {
  video: "Video",
  article: "Article",
  book: "Book",
  audio: "Audio",
  link: "Link",
};

export const LEARNING_FILTERS: { value: "all" | LearningKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos" },
  { value: "article", label: "Articles" },
  { value: "book", label: "Books" },
  { value: "audio", label: "Audio" },
];

export const isExternal = (url?: string | null) => !!url && /^https?:\/\//.test(url) && !/\.(pdf|docx?|pptx?|mp3|mp4|wav)$/i.test(url);
