export interface Attachment {
  id: number
  name: string
  size: number
  url: string
}

/** Konversi File[] dari <input type="file"> jadi Attachment[] (blob URL, hanya valid selama sesi browser ini). */
export function filesToAttachments(files: File[], startId = 1): Attachment[] {
  return files.map((file, index) => ({
    id: startId + index,
    name: file.name,
    size: file.size,
    url: URL.createObjectURL(file),
  }))
}
