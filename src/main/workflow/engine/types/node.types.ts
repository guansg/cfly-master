/** Node type metadata + execute hooks */

import { INodeExecutionData } from './data.types';
import { IExecuteContext } from './context.types';

export interface INodeTypeDescription {
  type: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  version: number;
  defaults: {
    name: string;
  };
  inputs: string[];
  outputs: string[];
  properties: INodePropertyDescription[];
}

export interface INodePropertyDescription {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'json' | 'collection' | 'expression';
  default?: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: string | number }>;
  placeholder?: string;
  displayOptions?: {
    show?: Record<string, any[]>;
    hide?: Record<string, any[]>;
  };
}

export interface INodeType {
  description: INodeTypeDescription;
  execute(context: IExecuteContext): Promise<INodeExecutionData[][]>;
}
