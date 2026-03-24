/**
 * Stop — abort the run via ApplicationError (stop error strategy).
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';
import { ApplicationError } from '../../../engine/types/errors';

export class StopNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:stop',
    displayName: 'Stop',
    description: 'Terminate the workflow with an optional message',
    icon: 'square',
    category: 'logic',
    version: 1,
    defaults: { name: 'Stop' },
    inputs: ['main'],
    outputs: [],
    properties: [
      {
        name: 'message',
        displayName: 'Stop Message',
        type: 'string',
        default: 'Workflow stopped',
        description: 'Message recorded in the execution result',
      },
      {
        name: 'isError',
        displayName: 'Mark as Error',
        type: 'boolean',
        default: false,
        description: 'If true, the execution status will be "error"',
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const message = context.getNodeParameter<string>('message', 0, 'Workflow stopped');
    const isError = context.getNodeParameter<boolean>('isError', 0, false);

    if (isError) {
      throw new ApplicationError(message);
    }

    context.logger.info(`[Stop] ${message}`);
    return [[]];
  }
}
