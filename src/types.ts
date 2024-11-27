// src/types.ts
export interface FlashRepoConfig {
    excludedDirs: string[];
    excludedFiles: string[];
    includedExtensions: string[];
}

export interface FileStats {
    path: string;
    size: number;
    characters: number;
    extension: string;
}

export interface ProcessingResult {
    files: FileStats[];
    totalCharacters: number;
    totalSize: number;
}

export type ProcessingOptions = {
    maxSize?: number;
    skipWarnings?: boolean;
};