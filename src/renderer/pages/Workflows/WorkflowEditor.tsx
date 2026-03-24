/**
 * Visual workflow editor page
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useWorkflowEditorStore } from './store/workflow-store';
import { Toolbar } from './components/Toolbar';
import { NodePalette } from './components/NodePalette';
import { Canvas } from './components/Canvas';
import { NodeConfigPanel } from './components/NodeConfigPanel';
import { ExecutionLogPanel, type ExecutionLogLine } from './components/ExecutionLogPanel';
import { repairMergeInboundConnectionIndices } from '@shared/workflow/repair-merge-connections';

interface WorkflowDefinition {
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    parameters: Record<string, any>;
  }>;
  connections: Record<string, {
    main: Array<Array<{ node: string; type: string; index: number }> | null>;
  }>;
}

const NODE_TYPE_TO_FLOW: Record<string, string> = {
  'manual-trigger': 'trigger',
  'data:set-data': 'data',
  'data:log': 'data',
  'data:transform': 'data',
  'logic:condition': 'logic',
  'logic:switch': 'logic',
  'logic:loop': 'logic',
  'logic:while': 'logic',
  'logic:parallel': 'logic',
  'logic:merge': 'logic',
  'logic:delay': 'logic',
  'logic:stop': 'logic',
};

function definitionToFlow(def: WorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = def.nodes.map((n) => ({
    id: n.id,
    type: NODE_TYPE_TO_FLOW[n.type] || 'data',
    position: { x: n.position.x, y: n.position.y },
    data: { label: n.name, nodeType: n.type, parameters: n.parameters },
  }));

  const edges: Edge[] = [];
  for (const sourceId in def.connections) {
    const outputs = def.connections[sourceId]?.main || [];
    for (let outIdx = 0; outIdx < outputs.length; outIdx++) {
      const conns = outputs[outIdx];
      if (!conns) continue;
      for (const conn of conns) {
        edges.push({
          id: `${sourceId}-${outIdx}-${conn.node}-${conn.index}`,
          source: sourceId,
          target: conn.node,
          sourceHandle: `output-${outIdx}`,
          targetHandle: `input-${conn.index}`,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        });
      }
    }
  }

  return { nodes, edges };
}

/** Parse port index from handle id: 'output-1' → 1, undefined → 0 */
function parsePortIndex(handleId: string | null | undefined): number {
  if (!handleId) return 0;
  const match = handleId.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

function flowToDefinition(nodes: Node[], edges: Edge[]): WorkflowDefinition {
  const defNodes = nodes.map((n) => ({
    id: n.id,
    type: (n.data as any).nodeType || n.type || 'unknown',
    name: (n.data as any).label || n.id,
    position: { x: n.position.x, y: n.position.y },
    parameters: (n.data as any).parameters || {},
  }));

  const connections: WorkflowDefinition['connections'] = {};
  for (const edge of edges) {
    const outputIdx = parsePortIndex(edge.sourceHandle);
    const inputIdx = parsePortIndex(edge.targetHandle);

    if (!connections[edge.source]) {
      connections[edge.source] = { main: [] };
    }
    const main = connections[edge.source].main;
    while (main.length <= outputIdx) main.push([]);
    if (!main[outputIdx]) main[outputIdx] = [];
    main[outputIdx].push({ node: edge.target, type: 'main', index: inputIdx });
  }

  const def: WorkflowDefinition = { nodes: defNodes, connections };
  repairMergeInboundConnectionIndices(def);
  return def;
}

interface ExecutionResult {
  status: string;
  durationMs?: number;
  lastNodeExecuted?: string;
  error?: string;
  nodeResults: Record<string, Array<{
    status: string;
    executionTime: number;
    outputItems: number;
    error?: string;
  }>>;
}

function WorkflowEditorInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useWorkflowEditorStore();
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogLine[]>([]);
  const nodeStatusRef = useRef<Record<string, 'running' | 'success' | 'error'>>({});

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const result = await window.electron.ipcRenderer.invoke('workflow:get', id);
        if (!result.success) {
          navigate('/workflows');
          return;
        }

        const wf = result.data;
        setIsFrozen(!!wf.frozenAt);

        let def: WorkflowDefinition;
        try {
          def = JSON.parse(wf.definition);
        } catch {
          def = { nodes: [], connections: {} };
        }

        repairMergeInboundConnectionIndices(def);

        const { nodes, edges } = definitionToFlow(def);
        store.setWorkflow(wf.id, wf.name, nodes, edges);
      } catch (error) {
        console.error('Failed to load workflow:', error);
        navigate('/workflows');
      } finally {
        setLoading(false);
      }
    })();

    return () => store.reset();
  }, [id]);

  useEffect(() => {
    const onNodeStart = (data: any) => {
      if (data.workflowId !== store.workflowId) return;
      nodeStatusRef.current[data.nodeId] = 'running';
      store.updateNodeData(data.nodeId, { executionStatus: 'running' });
    };
    const onNodeDone = (data: any) => {
      if (data.workflowId !== store.workflowId) return;
      nodeStatusRef.current[data.nodeId] = 'success';
      store.updateNodeData(data.nodeId, {
        executionStatus: 'success',
        executionTime: data.durationMs,
        outputItemCount: data.outputItemCount,
      });
    };
    const onNodeError = (data: any) => {
      if (data.workflowId !== store.workflowId) return;
      nodeStatusRef.current[data.nodeId] = 'error';
      store.updateNodeData(data.nodeId, {
        executionStatus: 'error',
        executionError: data.error,
      });
    };

    const onWorkflowLog = (data: {
      workflowId: string;
      nodeId: string;
      level: string;
      message: string;
      itemIndex: number;
    }) => {
      if (data.workflowId !== store.workflowId) return;
      const nodes = useWorkflowEditorStore.getState().nodes;
      const node = nodes.find((n) => n.id === data.nodeId);
      const nodeLabel = String((node?.data as Record<string, unknown>)?.label || data.nodeId);
      const time = new Date().toLocaleTimeString(undefined, { hour12: false });
      const line: ExecutionLogLine = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        time,
        level: data.level,
        nodeId: data.nodeId,
        nodeLabel,
        message: data.message,
        itemIndex: data.itemIndex ?? 0,
      };
      setExecutionLogs((prev) => [...prev, line]);
    };

    const sub1 = window.electronAPI.on('workflow:node-start', onNodeStart);
    const sub2 = window.electronAPI.on('workflow:node-done', onNodeDone);
    const sub3 = window.electronAPI.on('workflow:node-error', onNodeError);
    const sub4 = window.electronAPI.on('workflow:log', onWorkflowLog);

    return () => {
      if (sub1) window.electronAPI.removeListener('workflow:node-start', sub1);
      if (sub2) window.electronAPI.removeListener('workflow:node-done', sub2);
      if (sub3) window.electronAPI.removeListener('workflow:node-error', sub3);
      if (sub4) window.electronAPI.removeListener('workflow:log', sub4);
    };
  }, [store.workflowId]);

  const handleSave = useCallback(async () => {
    if (!store.workflowId) return;
    if (isFrozen) {
      alert('冻结的工作流无法保存修改');
      return;
    }

    store.setSaving(true);
    try {
      const definition = flowToDefinition(store.nodes, store.edges);

      await window.electron.ipcRenderer.invoke('workflow:update', store.workflowId, {
        name: store.workflowName,
      });

      await window.electron.ipcRenderer.invoke(
        'workflow:save',
        store.workflowId,
        JSON.stringify(definition),
      );

      store.setDirty(false);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      store.setSaving(false);
    }
  }, [store, isFrozen]);

  const handleRun = useCallback(async () => {
    if (!store.workflowId) return;
    if (isFrozen) {
      alert('冻结的工作流无法运行');
      return;
    }
    if (isRunning) return;

    setIsRunning(true);
    setExecutionResult(null);
    setExecutionLogs([]);
    nodeStatusRef.current = {};

    for (const node of store.nodes) {
      store.updateNodeData(node.id, {
        executionStatus: undefined,
        executionTime: undefined,
        executionError: undefined,
        outputItemCount: undefined,
      });
    }

    if (store.isDirty) {
      await handleSave();
    }

    try {
      const result = await window.electron.ipcRenderer.invoke('workflow:execute', store.workflowId);
      if (result.success) {
        setExecutionResult(result.data);
      } else {
        setExecutionResult({
          status: 'error',
          error: result.error,
          nodeResults: {},
        });
      }
    } catch (error: any) {
      setExecutionResult({
        status: 'error',
        error: error.message,
        nodeResults: {},
      });
    } finally {
      setIsRunning(false);
    }
  }, [store, isRunning, isFrozen, handleSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <Toolbar onSave={handleSave} onRun={handleRun} isRunning={isRunning} isFrozen={isFrozen} />

      {executionResult && (
        <ExecutionBanner result={executionResult} onClose={() => setExecutionResult(null)} />
      )}

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <NodePalette />
          <Canvas />
          <NodeConfigPanel />
        </div>
        <ExecutionLogPanel lines={executionLogs} onClear={() => setExecutionLogs([])} />
      </div>
    </div>
  );
}

function ExecutionBanner({ result, onClose }: { result: ExecutionResult; onClose: () => void }) {
  const isSuccess = result.status === 'success';

  return (
    <div className={`flex items-center gap-3 px-4 py-2 text-sm flex-shrink-0 ${
      isSuccess
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800'
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="font-medium">
        {isSuccess ? '执行完成' : '执行失败'}
      </span>
      {result.durationMs != null && (
        <span className="text-xs opacity-70">{result.durationMs}ms</span>
      )}
      {result.error && (
        <span className="text-xs opacity-80 truncate max-w-md">
          {result.error}
        </span>
      )}
      <div className="flex-1" />
      <button onClick={onClose} className="text-xs hover:underline opacity-70">
        关闭
      </button>
    </div>
  );
}

export function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner />
    </ReactFlowProvider>
  );
}
