/** Registers all built-in node types */

import { NodeRegistryImpl } from '../engine/core/node-registry';
import { ManualTriggerNode } from './trigger';
import { SetDataNode, LogNode, TransformNode } from './data';
import {
  ConditionNode,
  SwitchNode,
  LoopNode,
  WhileNode,
  ParallelLoopNode,
  MergeNode,
  DelayNode,
  StopNode,
} from './logic';

export function createDefaultRegistry(): NodeRegistryImpl {
  const registry = new NodeRegistryImpl();

  registry.register(new ManualTriggerNode());
  registry.register(new SetDataNode());
  registry.register(new LogNode());
  registry.register(new TransformNode());
  registry.register(new ConditionNode());
  registry.register(new SwitchNode());
  registry.register(new LoopNode());
  registry.register(new WhileNode());
  registry.register(new ParallelLoopNode());
  registry.register(new MergeNode());
  registry.register(new DelayNode());
  registry.register(new StopNode());

  return registry;
}

export { ManualTriggerNode } from './trigger';
export { SetDataNode, LogNode, TransformNode } from './data';
export {
  ConditionNode,
  SwitchNode,
  LoopNode,
  WhileNode,
  ParallelLoopNode,
  MergeNode,
  DelayNode,
  StopNode,
} from './logic';
