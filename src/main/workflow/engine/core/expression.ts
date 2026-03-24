/**
 * Evaluates `{{ }}` expressions against upstream item data.
 * Safety: shadow dangerous globals to undefined.
 */

import { INodeExecutionData } from '../types/data.types';
import { ExpressionError } from '../types/errors';

const EXPRESSION_REGEX = /\{\{\s*(.*?)\s*\}\}/g;

/** Names that cannot be `new Function` parameter names in strict mode */
const RESERVED_STRICT_PARAM_NAMES = new Set(['eval', 'arguments']);

const DANGEROUS_GLOBALS = [
  'process', 'require', 'module', 'exports', '__dirname', '__filename',
  'eval', 'Function', 'globalThis', 'global', 'Window', 'window',
  'document', 'XMLHttpRequest', 'fetch', 'WebSocket',
  'importScripts', 'Deno', 'Bun',
  'Proxy', 'Reflect', 'Symbol', 'WeakRef', 'FinalizationRegistry',
  'SharedArrayBuffer', 'Atomics',
];

function createSafeObject(): typeof Object {
  const handler: ProxyHandler<typeof Object> = {
    get(target, prop) {
      const blocked = ['getPrototypeOf', 'setPrototypeOf', 'defineProperty', 'defineProperties'];
      if (typeof prop === 'string' && blocked.includes(prop)) return undefined;
      return Reflect.get(target, prop);
    },
  };
  return new Proxy(Object, handler);
}

export class ExpressionEngine {
  evaluate(
    expression: string,
    inputData: INodeExecutionData[],
    itemIndex: number,
    variables: Record<string, any> = {},
    extra?: {
      runIndex?: number;
      executionId?: string;
      executionMode?: string;
      workflowId?: string;
      workflowName?: string;
      runData?: Record<string, any>;
    },
  ): any {
    if (!expression || typeof expression !== 'string') return expression;
    if (!expression.includes('{{')) return expression;

    const currentItem = inputData[itemIndex] || { json: {} };

    const context: Record<string, any> = {
      $json: currentItem.json,
      $binary: currentItem.binary || {},
      $item: currentItem,
      $input: {
        item: currentItem,
        all: () => inputData,
        first: () => inputData[0],
        last: () => inputData[inputData.length - 1],
      },
      $itemIndex: itemIndex,
      $runIndex: extra?.runIndex ?? 0,
      $execution: {
        id: extra?.executionId || '',
        mode: extra?.executionMode || 'manual',
      },
      $workflow: {
        id: extra?.workflowId || '',
        name: extra?.workflowName || '',
      },
      $vars: variables,

      // Safe built-ins
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object: createSafeObject(),
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      encodeURI,
      decodeURI,
      Map,
      Set,
      RegExp,
      Error,
      Promise,
      Intl,
      DateTime: {
        now: () => new Date(),
        fromISO: (s: string) => new Date(s),
        fromMillis: (ms: number) => new Date(ms),
      },
    };

    // Shadow dangerous globals with undefined
    for (const name of DANGEROUS_GLOBALS) {
      context[name] = undefined;
    }
    context['constructor'] = undefined;
    context['__proto__'] = undefined;
    context['prototype'] = undefined;

    const allMatches = [...expression.matchAll(EXPRESSION_REGEX)];
    if (
      allMatches.length === 1 &&
      allMatches[0][0].trim() === expression.trim()
    ) {
      return this.evaluateSingle(allMatches[0][1].trim(), context);
    }

    return expression.replace(EXPRESSION_REGEX, (_match, expr) => {
      const result = this.evaluateSingle(expr.trim(), context);
      return result === undefined || result === null ? '' : String(result);
    });
  }

  private evaluateSingle(expr: string, context: Record<string, any>): any {
    if (expr.includes('.__proto__') || expr.includes('["__proto__"]') || expr.includes("['__proto__']")) {
      throw new ExpressionError('Access to __proto__ is not allowed');
    }
    if (expr.includes('.constructor') && !expr.startsWith('$')) {
      throw new ExpressionError('Access to .constructor is not allowed on non-$ variables');
    }
    if (/\beval\s*\(/.test(expr) || /\bFunction\s*\(/.test(expr)) {
      throw new ExpressionError('eval() and Function() are not allowed in expressions');
    }

    try {
      const allKeys = Object.keys(context);
      const keys = allKeys.filter((k) => !RESERVED_STRICT_PARAM_NAMES.has(k));
      const values = keys.map((k) => context[k]);
      const fn = new Function(...keys, `"use strict"; return (${expr});`);
      return fn(...values);
    } catch (error: any) {
      throw new ExpressionError(`Expression evaluation failed: ${expr} — ${error.message}`);
    }
  }
}
