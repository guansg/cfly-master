/**
 * While — conditional loop.
 * While true, items stay on the loop output; port 0 = continue, port 1 = exit.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class WhileNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:while',
    displayName: 'While',
    description: 'Repeat while a condition is true. Port 0 = continue, Port 1 = done.',
    icon: 'rotate-cw',
    category: 'logic',
    version: 1,
    defaults: { name: 'While' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: [
      {
        name: 'condition',
        displayName: 'Continue Condition',
        type: 'string',
        default: '{{ $json.continue === true }}',
        description: 'Expression that returns boolean. true = keep looping.',
      },
      {
        name: 'maxIterations',
        displayName: 'Max Iterations',
        type: 'number',
        default: 100,
        description: 'Safety limit on loop iterations',
      },
    ],
  };

  /** Match description default; avoid getNodeParameter('condition') — unsaved fallback string 'false' is truthy in Boolean('false'). */
  private static readonly DEFAULT_CONDITION = '{{ $json.continue === true }}';

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const node = context.getNode();
    const rawCondition = ((node.parameters?.condition as string) ?? '').trim();
    const conditionExpr = rawCondition || WhileNode.DEFAULT_CONDITION;

    const loopItems: INodeExecutionData[] = [];
    const doneItems: INodeExecutionData[] = [];

    for (let i = 0; i < inputData.length; i++) {
      let shouldContinue = false;
      try {
        const result = context.evaluateExpression(conditionExpr, i);
        shouldContinue = toContinueBool(result);
      } catch {
        shouldContinue = false;
      }

      if (shouldContinue) {
        loopItems.push({ ...inputData[i], pairedItem: { item: i } });
      } else {
        doneItems.push({ ...inputData[i], pairedItem: { item: i } });
      }
    }

    return [loopItems, doneItems];
  }
}

/** Coerce expression result to continue/done; avoid Boolean('false') === true */
function toContinueBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'false' || s === '0' || s === '') return false;
    if (s === 'true' || s === '1') return true;
  }
  return Boolean(v);
}
