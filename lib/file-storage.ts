"use client"

// Utility functions for storing and retrieving file data from localStorage

export interface StoredFileData {
  name: string
  type: string
  size: number
  data: string // base64 encoded file data
  timestamp: number
}

export class FileStorage {
  private static readonly STORAGE_PREFIX = 'cargo-file-storage-'
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB limit

  /**
   * Store file data in localStorage
   */
  static async storeFile(file: File, key: string): Promise<boolean> {
    try {
      // Check file size limit
      if (file.size > this.MAX_FILE_SIZE) {
        console.error('File too large:', file.size, 'bytes')
        return false
      }

      // Convert file to base64
      const data = await this.fileToBase64(file)
      
      const storedData: StoredFileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data,
        timestamp: Date.now()
      }

      // Store in localStorage
      const storageKey = this.STORAGE_PREFIX + key
      localStorage.setItem(storageKey, JSON.stringify(storedData))
      return true
    } catch (error) {
      console.error('Error storing file:', error)
      return false
    }
  }

  /**
   * Retrieve file data from localStorage and convert back to File object
   */
  static retrieveFile(key: string): File | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key
      const stored = localStorage.getItem(storageKey)
      if (!stored) {
        return null
      }

      const storedData: StoredFileData = JSON.parse(stored)
      
      // Convert base64 back to File
      const file = this.base64ToFile(storedData.data, storedData.name, storedData.type)
      return file
    } catch (error) {
      console.error('Error retrieving file:', error)
      return null
    }
  }

  /**
   * Remove file data from localStorage
   */
  static removeFile(key: string): void {
    localStorage.removeItem(this.STORAGE_PREFIX + key)
  }

  /**
   * Check if file exists in storage
   */
  static hasFile(key: string): boolean {
    return localStorage.getItem(this.STORAGE_PREFIX + key) !== null
  }

  /**
   * Get file info without loading the full file
   */
  static getFileInfo(key: string): { name: string; size: number; timestamp: number } | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key)
      if (!stored) return null

      const storedData: StoredFileData = JSON.parse(stored)
      return {
        name: storedData.name,
        size: storedData.size,
        timestamp: storedData.timestamp
      }
    } catch (error) {
      console.error('Error getting file info:', error)
      return null
    }
  }

  /**
   * Convert File to base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove data URL prefix (e.g., "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Convert base64 string back to File object
   */
  private static base64ToFile(base64: string, filename: string, mimeType: string): File {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new File([byteArray], filename, { type: mimeType })
  }

  /**
   * Clean up old files (older than 7 days)
   */
  static cleanupOldFiles(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const storedData: StoredFileData = JSON.parse(stored)
            if (storedData.timestamp < sevenDaysAgo) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      }
    }
  }
}
