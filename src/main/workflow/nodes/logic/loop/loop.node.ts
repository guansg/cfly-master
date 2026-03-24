/**
 * Loop — emit one item per batch for downstream serial iteration.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class LoopNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:loop',
    displayName: 'Loop Over Items',
    description: 'Process each item individually in serial',
    icon: 'repeat',
    category: 'logic',
    version: 1,
    defaults: { name: 'Loop Over Items' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: [
      {
        name: 'batchSize',
        displayName: 'Batch Size',
        type: 'number',
        default: 1,
        description: 'Number of items to process per batch (1 = one at a time)',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const batchSize = context.getNodeParameter<number>('batchSize', 0, 1);

    if (inputData.length === 0) {
      return [[], inputData];
    }

    const effectiveBatch = Math.max(1, Math.min(batchSize, inputData.length));
    const batch = inputData.slice(0, effectiveBatch).map((item, idx) => ({
      ...item,
      pairedItem: { item: idx },
    }));
    const remaining = inputData.slice(effectiveBatch);

    return [batch, remaining];
  }
}
