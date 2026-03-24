/**
 * If — port 0 = true branch, port 1 = false branch.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class ConditionNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:condition',
    displayName: 'If',
    description: 'Split items into true/false branches based on a condition',
    icon: 'git-branch',
    category: 'logic',
    version: 1,
    defaults: { name: 'If' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: [
      {
        name: 'conditions',
        displayName: 'Conditions',
        type: 'json',
        default: '[{"field": "$json.value", "operator": "equal", "value": ""}]',
        description: 'Array of condition objects. All must pass (AND logic).',
      },
      {
        name: 'combineOperation',
        displayName: 'Combine Mode',
        type: 'options',
        default: 'all',
        options: [
          { name: 'All conditions must be true (AND)', value: 'all' },
          { name: 'Any condition must be true (OR)', value: 'any' },
        ],
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const conditionsRaw = context.getNodeParameter<any>('conditions', 0, []);
    const combineOp = context.getNodeParameter<string>('combineOperation', 0, 'all');

    let conditions: Array<{ field: string; operator: string; value: any }> = [];
    try {
      conditions = typeof conditionsRaw === 'string' ? JSON.parse(conditionsRaw) : conditionsRaw;
    } catch {
      conditions = [];
    }

    const trueItems: INodeExecutionData[] = [];
    const falseItems: INodeExecutionData[] = [];

    for (let i = 0; i < inputData.length; i++) {
      const item = inputData[i];
      const results = conditions.map(cond => {
        const fieldValue = context.evaluateExpression(cond.field, i);
        return this.evaluate(fieldValue, cond.operator, cond.value);
      });

      const passes = combineOp === 'any'
        ? results.some(Boolean)
        : results.every(Boolean);

      if (passes) {
        trueItems.push({ ...item, pairedItem: { item: i } });
      } else {
        falseItems.push({ ...item, pairedItem: { item: i } });
      }
    }

    return [trueItems, falseItems];
  }

  private evaluate(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equal': return fieldValue == compareValue;
      case 'notEqual': return fieldValue != compareValue;
      case 'strictEqual': return fieldValue === compareValue;
      case 'contains': return String(fieldValue).includes(String(compareValue));
      case 'notContains': return !String(fieldValue).includes(String(compareValue));
      case 'startsWith': return String(fieldValue).startsWith(String(compareValue));
      case 'endsWith': return String(fieldValue).endsWith(String(compareValue));
      case 'gt': return Number(fieldValue) > Number(compareValue);
      case 'gte': return Number(fieldValue) >= Number(compareValue);
      case 'lt': return Number(fieldValue) < Number(compareValue);
      case 'lte': return Number(fieldValue) <= Number(compareValue);
      case 'empty': return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'notEmpty': return !!fieldValue && !(Array.isArray(fieldValue) && fieldValue.length === 0);
      case 'regex': {
        try { return new RegExp(String(compareValue)).test(String(fieldValue)); } catch { return false; }
      }
      default: return false;
    }
  }
}
