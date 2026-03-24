/** Serialized workflow definition (n8n-style) */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: INode[];
  connections: IConnections;
  variables?: Record<string, any>;
  settings?: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSettings {
  executionOrder?: 'v1';
  timeout?: number;
  timezone?: string;
  maxExecutionSteps?: number;
}

export interface INode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  disabled?: boolean;
  parameters: Record<string, any>;

  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  hasSideEffects?: boolean;

  errorStrategy?: 'stop' | 'useDefault' | 'failBranch';
  defaultOutput?: Record<string, any>;
  errorScope?: string;
  requiredInputs?: number[] | number;
}

export interface IConnections {
  [sourceNodeId: string]: {
    main: Array<IConnection[] | null>;
  };
}

export interface IConnection {
  node: string;
  type: string;
  index: number;
}
