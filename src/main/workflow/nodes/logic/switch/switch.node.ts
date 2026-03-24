/**
 * Switch — multi-way branch by field value; last output is fallthrough.
 */

import { BaseNode } from '../../base-node';
import { INodeTypeDescription } from '../../../engine/types/node.types';
import { IExecuteContext } from '../../../engine/types/context.types';
import { INodeExecutionData } from '../../../engine/types/data.types';

export class SwitchNode extends BaseNode {
  description: INodeTypeDescription = {
    type: 'logic:switch',
    displayName: 'Switch',
    description: 'Route items to different outputs based on a field value',
    icon: 'git-merge',
    category: 'logic',
    version: 1,
    defaults: { name: 'Switch' },
    inputs: ['main'],
    outputs: ['main', 'main', 'main', 'main'],
    properties: [
      {
        name: 'field',
        displayName: 'Field to switch on',
        type: 'string',
        default: '{{ $json.type }}',
        description: 'Expression that produces the value to match',
      },
      {
        name: 'cases',
        displayName: 'Cases',
        type: 'json',
        default: '[{"value": "a"},{"value": "b"},{"value": "c"}]',
        description: 'Array of case values. Each maps to an output port (0-indexed). Last port = fallthrough.',
      },
    ],
  };

  /** Match description defaults; avoids fallthrough when UI shows defaults but parameters are empty */
  private static readonly DEFAULT_FIELD = '{{ $json.type }}';
  private static readonly DEFAULT_CASES_JSON =
    '[{"value":"a"},{"value":"b"},{"value":"c"}]';

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputData = context.getInputData();
    const node = context.getNode();
    // Use raw expression text — getNodeParameter('field',0) would evaluate once on item 0 and mis-route.
    const rawFieldTrim = ((node.parameters?.field as string) ?? '').trim();
    const fieldExpr = rawFieldTrim || SwitchNode.DEFAULT_FIELD;
    const rawCases = node.parameters?.cases;
    let cases: Array<{ value: any }> = [];
    try {
      cases =
        typeof rawCases === 'string'
          ? JSON.parse(rawCases)
          : Array.isArray(rawCases)
            ? rawCases
            : [];
    } catch {
      cases = [];
    }
    if (!cases.length) {
      try {
        cases = JSON.parse(SwitchNode.DEFAULT_CASES_JSON);
      } catch {
        cases = [];
      }
    }

    const outputs: INodeExecutionData[][] = Array.from({ length: cases.length + 1 }, () => []);

    for (let i = 0; i < inputData.length; i++) {
      const value = context.evaluateExpression(fieldExpr, i);
      const matchIndex = cases.findIndex(c => c.value == value || c.value === value);

      if (matchIndex !== -1) {
        outputs[matchIndex].push({ ...inputData[i], pairedItem: { item: i } });
      } else {
        outputs[outputs.length - 1].push({ ...inputData[i], pairedItem: { item: i } });
      }
    }

    return outputs;
  }
}
