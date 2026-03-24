/**
 * Merge — combine multiple branches.
 * Waits for all inputs (waitingExecution); then merges per mode.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class MergeNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:merge',
    displayName: 'Merge',
    description: 'Merge data from multiple branches into one stream',
    icon: 'merge',
    category: 'logic',
    version: 1,
    defaults: { name: 'Merge' },
    inputs: ['main', 'main'],
    outputs: ['main'],
    properties: [
      {
        name: 'mode',
        displayName: 'Mode',
        type: 'options',
        default: 'append',
        options: [
          { name: 'Append (combine all items)', value: 'append' },
          { name: 'Zip (pair items by index)', value: 'zip' },
          { name: 'Passthrough (first input only)', value: 'passthrough' },
        ],
      },
    ],
  };

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const port0 = context.getInputData(0);
    const port1 = context.getInputData(1);
    const mode = context.getNodeParameter<string>('mode', 0, 'append');

    if (mode === 'passthrough') {
      return [port0.map((item, i) => ({ ...item, pairedItem: { item: i } }))];
    }

    if (mode === 'append') {
      const merged = [...port0, ...port1];
      return [merged.map((item, i) => ({ ...item, pairedItem: { item: i } }))];
    }

    // Zip: merge JSON by index; later keys overwrite
    const maxLen = Math.max(port0.length, port1.length);
    const out: INodeExecutionData[] = [];
    for (let i = 0; i < maxLen; i++) {
      const ja = port0[i]?.json ?? {};
      const jb = port1[i]?.json ?? {};
      out.push({
        json: { ...ja, ...jb },
        binary: port0[i]?.binary ?? port1[i]?.binary,
        pairedItem: { item: i },
      });
    }
    return [out];
  }
}
