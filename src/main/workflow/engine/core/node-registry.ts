/** Maps node type strings to INodeType implementations */

import { INodeType } from '../types/node.types';
import { NodeRegistry } from '../types/execution.types';

export class NodeRegistryImpl implements NodeRegistry {
  private nodes = new Map<string, INodeType>();

  register(nodeType: INodeType): void {
    this.nodes.set(nodeType.description.type, nodeType);
  }

  get(type: string): INodeType | undefined {
    return this.nodes.get(type);
  }

  getAll(): INodeType[] {
    return Array.from(this.nodes.values());
  }

  has(type: string): boolean {
    return this.nodes.has(type);
  }
}
