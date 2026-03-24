/** Set Data — assign or merge JSON fields */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class SetDataNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'data:set-data',
    displayName: 'Set Data',
    description: 'Set or modify data fields',
    icon: 'database',
    category: 'data',
    version: 1,
    defaults: { name: 'Set Data' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'manual',
        options: [
          { name: 'Manual', value: 'manual' },
          { name: 'JSON', value: 'json' },
        ],
      },
      {
        name: 'jsonData',
        displayName: 'JSON Data',
        type: 'json',
        default: '{}',
        description: 'JSON data to set (when mode is JSON)',
        displayOptions: { show: { mode: ['json'] } },
      },
      {
        name: 'keepOnlySet',
        displayName: 'Keep Only Set',
        type: 'boolean',
        default: false,
        description: 'If true, only keep the fields that are explicitly set',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const mode = context.getNodeParameter<string>('mode', 0, 'manual');
    const keepOnlySet = context.getNodeParameter<boolean>('keepOnlySet', 0, false);

    const results: INodeExecutionData[] = [];

    if (mode === 'json') {
      const jsonRaw = context.getNodeParameter<string>('jsonData', 0, '{}');
      let newData: Record<string, any>;
      try {
        newData = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
      } catch {
        newData = {};
      }

      for (let i = 0; i < inputData.length; i++) {
        results.push({
          json: keepOnlySet ? { ...newData } : { ...inputData[i].json, ...newData },
          binary: inputData[i].binary,
          pairedItem: { item: i },
        });
      }
    } else {
      for (let i = 0; i < inputData.length; i++) {
        results.push({
          json: keepOnlySet ? {} : { ...inputData[i].json },
          binary: inputData[i].binary,
          pairedItem: { item: i },
        });
      }
    }

    return [results];
  }
}
