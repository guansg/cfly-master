/**
 * Default node lifecycle: optional preProcess → execute → optional postProcess.
 */

import { INodeType, INodeTypeDescription } from '../engine/types/node.types';
import { IExecuteContext } from '../engine/types/context.types';
import { INodeExecutionData } from '../engine/types/data.types';

export abstract class BaseNode implements INodeType {
  abstract description: INodeTypeDescription;

  /** Runs preProcess → execute → postProcess when defined */
  async run(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    let inputData = context.getInputData();

    if (this.preProcess) {
      inputData = await this.preProcess(context, inputData);
    }

    const output = await this.execute(context);

    if (this.postProcess) {
      return await this.postProcess(context, output);
    }

    return output;
  }

  preProcess?(context: IExecuteContext, input: INodeExecutionData[]): Promise<INodeExecutionData[]>;

  abstract execute(context: IExecuteContext): Promise<INodeExecutionData[][]>;

  postProcess?(context: IExecuteContext, output: INodeExecutionData[][]): Promise<INodeExecutionData[][]>;

  stream?(context: IExecuteContext): AsyncGenerator<INodeExecutionData>;
}
