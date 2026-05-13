import * as core from '@actions/core';

export const logger = {
  info: (message: string): void => {
    core.info(message);
  },
  
  warn: (message: string): void => {
    core.warning(message);
  },
  
  error: (message: string): void => {
    core.error(message);
  },
  
  debug: (message: string): void => {
    core.debug(message);
  },
  
  group: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    core.startGroup(name);
    try {
      const result = await fn();
      return result;
    } finally {
      core.endGroup();
    }
  },
};
