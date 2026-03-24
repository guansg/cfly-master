/** Workflow engine error types */

export class InfiniteLoopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfiniteLoopError';
  }
}

export class ApplicationError extends Error {
  extra?: Record<string, any>;
  cause?: unknown;

  constructor(message: string, options?: { extra?: Record<string, any>; cause?: unknown }) {
    super(message);
    this.name = 'ApplicationError';
    this.extra = options?.extra;
    if (options?.cause !== undefined) (this as Error & { cause?: unknown }).cause = options.cause;
  }
}

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpressionError';
  }
}

/**
 * Reserved for human-in-the-loop nodes: serialize state and resume later (future phase).
 */
export class InterruptError extends Error {
  readonly interruptData: Record<string, any>;

  constructor(message: string, interruptData: Record<string, any> = {}) {
    super(message);
    this.name = 'InterruptError';
    this.interruptData = interruptData;
  }
}
