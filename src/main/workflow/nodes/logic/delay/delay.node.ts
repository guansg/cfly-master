/** Delay — async sleep */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DelayNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:delay',
    displayName: 'Delay',
    description: 'Wait for a specified duration before continuing',
    icon: 'clock',
    category: 'logic',
    version: 1,
    defaults: { name: 'Delay' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'delayMs',
        displayName: 'Delay (ms)',
        type: 'number',
        default: 1000,
        description: 'Milliseconds to wait',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const delayMs = context.getNodeParameter<number>('delayMs', 0, 1000);
    context.checkAborted();
    await sleep(Math.max(0, delayMs));
    context.checkAborted();
    return [context.getInputData()];
  }
}
