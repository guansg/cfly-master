/**
 * Parallel loop — chunk items and run batches with Promise.all; ConcurrencyLimiter caps in-flight work.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ParallelLoopNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:parallel',
    displayName: 'Parallel Loop',
    description: 'Process items concurrently with a concurrency limit',
    icon: 'zap',
    category: 'logic',
    version: 1,
    defaults: { name: 'Parallel Loop' },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        name: 'concurrency',
        displayName: 'Max Concurrency',
        type: 'number',
        default: 5,
        description: 'Maximum number of items to process in parallel (1-20)',
      },
      {
        name: 'delayBetweenBatchesMs',
        displayName: 'Delay Between Batches (ms)',
        type: 'number',
        default: 0,
        description: 'Milliseconds to wait between batches',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const concurrency = Math.max(1, Math.min(20, context.getNodeParameter<number>('concurrency', 0, 5)));
    const delayMs = context.getNodeParameter<number>('delayBetweenBatchesMs', 0, 0);

    const results: INodeExecutionData[] = [];

    for (let batchStart = 0; batchStart < inputData.length; batchStart += concurrency) {
      context.checkAborted();
      const batch = inputData.slice(batchStart, batchStart + concurrency);

      const batchResults = await Promise.all(
        batch.map(async (item, idx) => ({
          ...item,
          json: {
            ...item.json,
            _parallelIndex: batchStart + idx,
            _batchIndex: Math.floor(batchStart / concurrency),
          },
          pairedItem: { item: batchStart + idx },
        })),
      );

      results.push(...batchResults);

      if (delayMs > 0 && batchStart + concurrency < inputData.length) {
        await sleep(delayMs);
      }
    }

    return [results];
  }
}
