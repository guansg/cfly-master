/** Log — write to execution log and pass items through */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class LogNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'data:log',
    displayName: 'Log',
    description: 'Log data for debugging, then pass through',
    icon: 'file-text',
    category: 'data',
    version: 1,
    defaults: { name: 'Log' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'message',
        displayName: 'Message',
        type: 'string',
        default: '',
        description: 'Optional log message (supports {{ expressions }})',
        placeholder: 'e.g. Processing item {{ $itemIndex }}',
      },
      {
        name: 'level',
        displayName: 'Level',
        type: 'options',
        default: 'info',
        options: [
          { name: 'Info', value: 'info' },
          { name: 'Warn', value: 'warn' },
          { name: 'Error', value: 'error' },
          { name: 'Debug', value: 'debug' },
        ],
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const message = context.getNodeParameter<string>('message', 0, '');
    const level = context.getNodeParameter<string>('level', 0, 'info') as 'info' | 'warn' | 'error' | 'debug';

    for (let i = 0; i < inputData.length; i++) {
      const resolvedMsg = message
        ? context.evaluateExpression(message, i)
        : JSON.stringify(inputData[i].json, null, 2);

      context.logger[level](`${resolvedMsg}`, { itemIndex: i });
    }

    return [inputData];
  }
}
