/**
 * Transform — map each item with expressions.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class TransformNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'data:transform',
    displayName: 'Transform',
    description: 'Map each item to a new shape using expressions',
    icon: 'shuffle',
    category: 'data',
    version: 1,
    defaults: { name: 'Transform' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'fields',
        displayName: 'Output Fields',
        type: 'json',
        default: '[{"name": "result", "value": "{{ $json.value }}"}]',
        description: 'Array of {name, value} objects. value supports {{ }} expressions.',
      },
      {
        name: 'includeOriginal',
        displayName: 'Include Original Fields',
        type: 'boolean',
        default: false,
        description: 'If true, original fields are kept and new fields are merged on top',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const fieldsRaw = context.getNodeParameter<any>('fields', 0, []);
    const includeOriginal = context.getNodeParameter<boolean>('includeOriginal', 0, false);

    let fields: Array<{ name: string; value: any }> = [];
    try {
      fields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : fieldsRaw;
    } catch {
      fields = [];
    }

    const results: INodeExecutionData[] = inputData.map((item, i) => {
      const newJson: Record<string, any> = includeOriginal ? { ...item.json } : {};

      for (const field of fields) {
        try {
          const value = typeof field.value === 'string' && field.value.includes('{{')
            ? context.evaluateExpression(field.value, i)
            : field.value;
          newJson[field.name] = value;
        } catch (err: any) {
          newJson[field.name] = null;
          context.logger.warn(`Transform field "${field.name}" error: ${err.message}`);
        }
      }

      return { json: newJson, binary: item.binary, pairedItem: { item: i } };
    });

    return [results];
  }
}
