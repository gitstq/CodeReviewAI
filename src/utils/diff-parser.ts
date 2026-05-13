import { Config } from '../config';
import { DiffFile, DiffChange } from '../types';
import { logger } from './logger';

export class DiffParser {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  parse(diff: string): DiffFile[] {
    const files: DiffFile[] = [];
    const fileChunks = diff.split('diff --git').filter(chunk => chunk.trim());

    for (const chunk of fileChunks) {
      try {
        const file = this.parseFileChunk(chunk);
        if (file) {
          files.push(file);
        }
      } catch (error) {
        logger.warn(`Failed to parse diff chunk: ${error}`);
      }
    }

    return files;
  }

  private parseFileChunk(chunk: string): DiffFile | null {
    const lines = chunk.split('\n');
    
    // Extract filename
    const fileMatch = chunk.match(/a\/(.+) b\/(.+)/);
    if (!fileMatch) {
      return null;
    }

    const filename = fileMatch[2];
    
    // Determine file status
    let status: DiffFile['status'] = 'modified';
    if (chunk.includes('new file mode')) {
      status = 'added';
    } else if (chunk.includes('deleted file mode')) {
      status = 'deleted';
    } else if (chunk.includes('rename from')) {
      status = 'renamed';
    }

    // Check if binary
    const isBinary = chunk.includes('Binary files') || chunk.includes('GIT binary patch');

    // Count additions and deletions
    let additions = 0;
    let deletions = 0;
    const changes: DiffChange[] = [];
    let currentLineNumber = 0;

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
        currentLineNumber++;
        changes.push({
          type: 'add',
          lineNumber: currentLineNumber,
          content: line.substring(1),
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
        changes.push({
          type: 'delete',
          lineNumber: currentLineNumber,
          content: line.substring(1),
        });
      } else if (line.startsWith(' ')) {
        currentLineNumber++;
        changes.push({
          type: 'normal',
          lineNumber: currentLineNumber,
          content: line.substring(1),
        });
      } else if (line.startsWith('@@')) {
        // Parse hunk header
        const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (hunkMatch) {
          currentLineNumber = parseInt(hunkMatch[3], 10);
        }
      }
    }

    return {
      filename,
      status,
      additions,
      deletions,
      isBinary,
      diff: chunk,
      changes,
    };
  }

  extractChangedLines(diff: string): Map<string, number[]> {
    const changedLines = new Map<string, number[]>();
    const files = this.parse(diff);

    for (const file of files) {
      const lines: number[] = [];
      for (const change of file.changes) {
        if (change.type === 'add') {
          lines.push(change.lineNumber);
        }
      }
      changedLines.set(file.filename, lines);
    }

    return changedLines;
  }

  truncateDiff(diff: string, maxSizeKB: number): string {
    const maxBytes = maxSizeKB * 1024;
    
    if (diff.length <= maxBytes) {
      return diff;
    }

    logger.warn(`Diff size (${diff.length} bytes) exceeds limit (${maxBytes} bytes), truncating...`);

    // Truncate while preserving file boundaries
    const files = this.parse(diff);
    let truncatedDiff = '';
    let currentSize = 0;

    for (const file of files) {
      const fileDiff = file.diff;
      if (currentSize + fileDiff.length > maxBytes) {
        logger.warn(`Skipping remaining files due to size limit`);
        break;
      }
      truncatedDiff += `diff --git${fileDiff}`;
      currentSize += fileDiff.length;
    }

    return truncatedDiff;
  }
}
