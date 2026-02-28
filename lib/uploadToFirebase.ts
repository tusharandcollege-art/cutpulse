/**
 * uploadToCloudinary
 * ─────────────────────────────────────────────────────────────────
 * Uploads a File or Blob to Cloudinary VIA OUR SERVER (/api/upload).
 * Returns both the public URL and the Cloudinary ID needed for cleanup.
 *
 * @param fileOrBlob  Native File or Blob to upload
 * @param folder      'images' | 'videos'
 * @param onProgress  Optional progress callback 0–100 (XHR upload progress)
 */
export interface UploadResult {
    url: string
    publicId: string
    resourceType: string
}

export async function uploadToFirebase(
    fileOrBlob: File | Blob,
    folder: 'images' | 'videos' = 'images',
    onProgress?: (pct: number) => void,
): Promise<string> {
    const result = await uploadFile(fileOrBlob, folder, onProgress)
    return result.url
}

export async function uploadFile(
    fileOrBlob: File | Blob,
    folder: 'images' | 'videos' = 'images',
    onProgress?: (pct: number) => void,
): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const formData = new FormData()
        formData.append('file', fileOrBlob)
        formData.append('folder', folder)

        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100))
            }
        })

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText) as UploadResult
                    if (data.url) {
                        resolve(data)
                    } else {
                        reject(new Error((data as unknown as { error: string }).error || 'No URL in response'))
                    }
                } catch {
                    reject(new Error('Invalid response from upload API'))
                }
            } else {
                try {
                    const data = JSON.parse(xhr.responseText)
                    reject(new Error(data.error || `Upload failed (${xhr.status})`))
                } catch {
                    reject(new Error(`Upload failed (${xhr.status})`))
                }
            }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
    })
}

/**
 * Delete uploaded temp files from Cloudinary after xskill confirms the task.
 */
export async function deleteUploadedFiles(
    items: { publicId: string; resourceType: string }[]
): Promise<void> {
    if (!items.length) return
    fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    }).catch(() => { /* best-effort */ })
}
