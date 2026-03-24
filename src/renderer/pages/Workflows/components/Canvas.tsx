/**
 * Workflow canvas (React Flow wrapper)
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowEditorStore } from '../store/workflow-store';
import { TriggerNode } from '../nodes/TriggerNode';
import { DataNode } from '../nodes/DataNode';
import { LogicNode } from '../nodes/LogicNode';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  data: DataNode,
  logic: LogicNode,
};

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNode } =
    useWorkflowEditorStore();

  const handleNodeClick = useCallback(
    (_: any, node: any) => setSelectedNode(node.id),
    [setSelectedNode],
  );

  const handlePaneClick = useCallback(() => setSelectedNode(null), [setSelectedNode]);

  const defaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }),
    [],
  );

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.type === 'trigger') return '#10b981';
            if (node.type === 'data') return '#8b5cf6';
            if (node.type === 'logic') return '#f59e0b';
            return '#6b7280';
          }}
          maskColor="rgba(0,0,0,0.08)"
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
        />
      </ReactFlow>
    </div>
  );
}
