/** Manual trigger — workflow entry point */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class ManualTriggerNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'manual-trigger',
    displayName: 'Manual Trigger',
    description: 'Starts the workflow when manually triggered',
    icon: 'play-circle',
    category: 'trigger',
    version: 1,
    defaults: { name: 'Manual Trigger' },
    inputs: [],
    outputs: ['main'],
    properties: [],
  };

  async execute(_context: IExecuteContext): Promise<INodeExecutionData[][]> {
    return [[{ json: { triggeredAt: new Date().toISOString() } }]];
  }
}
