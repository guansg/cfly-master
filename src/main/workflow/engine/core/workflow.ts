/**
 * Parsed workflow graph: nodes, connections, and lookup indexes (n8n-style).
 */

import {
  WorkflowDefinition,
  INode,
  IConnections,
  IConnection,
} from '../types/workflow.types';

export class Workflow {
  id: string;
  name: string;
  nodes: INode[];
  nodesById: Record<string, INode>;
  connectionsBySource: IConnections;
  connectionsByDestination: IConnections;
  settings: WorkflowDefinition['settings'];
  variables: Record<string, any>;

  constructor(definition: WorkflowDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.nodes = definition.nodes;
    this.settings = definition.settings;
    this.variables = definition.variables || {};

    this.nodesById = {};
    for (const node of this.nodes) {
      this.nodesById[node.id] = node;
    }

    this.connectionsBySource = definition.connections;
    this.connectionsByDestination = this.buildConnectionsByDestination(definition.connections);
  }

  private buildConnectionsByDestination(connections: IConnections): IConnections {
    const result: IConnections = {};

    for (const sourceNodeId in connections) {
      const outputs = connections[sourceNodeId]?.main || [];

      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
        const outputConnections = outputs[outputIndex];
        if (!outputConnections) continue;

        for (const connection of outputConnections) {
          const targetNodeId = connection.node;
          const inputIndex = connection.index;

          if (!result[targetNodeId]) {
            result[targetNodeId] = { main: [] };
          }

          while (result[targetNodeId].main.length <= inputIndex) {
            result[targetNodeId].main.push(null);
          }

          if (!result[targetNodeId].main[inputIndex]) {
            result[targetNodeId].main[inputIndex] = [];
          }

          result[targetNodeId].main[inputIndex]!.push({
            node: sourceNodeId,
            type: 'main',
            index: outputIndex,
          });
        }
      }
    }

    return result;
  }

  getTriggerNodes(): INode[] {
    return this.nodes.filter(node =>
      node.type.startsWith('trigger:') || node.type === 'manual-trigger'
    );
  }

  getNode(nodeId: string): INode | undefined {
    return this.nodesById[nodeId];
  }

  getChildNodes(nodeId: string): IConnection[] {
    const outputs = this.connectionsBySource[nodeId]?.main || [];
    const children: IConnection[] = [];
    for (const portConnections of outputs) {
      if (portConnections) {
        children.push(...portConnections);
      }
    }
    return children;
  }

  getParentNodes(nodeId: string): IConnection[] {
    const inputs = this.connectionsByDestination[nodeId]?.main || [];
    const parents: IConnection[] = [];
    for (const portConnections of inputs) {
      if (portConnections) {
        parents.push(...portConnections);
      }
    }
    return parents;
  }
}
