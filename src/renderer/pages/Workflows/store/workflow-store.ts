/**
 * Workflow editor UI state (Zustand)
 */

import { create } from 'zustand';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

/** Same as WorkflowEditor.parsePortIndex: input-0 / output-1 → numeric index */
function parseHandleIndex(handleId: string | null | undefined): number {
  if (!handleId) return 0;
  const match = handleId.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

/** Merge inputs: assign distinct handles so edges do not collapse to input-0 */
function resolveMergeTargetHandle(state: { nodes: Node[]; edges: Edge[] }, connection: Connection): Connection {
  const target = state.nodes.find((n) => n.id === connection.target);
  const nodeType = (target?.data as Record<string, unknown> | undefined)?.nodeType;
  if (nodeType !== 'logic:merge') return connection;

  const existing = state.edges.filter((e) => e.target === connection.target);
  const used = new Set(existing.map((e) => parseHandleIndex(e.targetHandle)));

  let idx: number;
  if (connection.targetHandle) {
    idx = parseHandleIndex(connection.targetHandle);
    if (used.has(idx)) {
      idx = 0;
      while (used.has(idx)) idx++;
    }
  } else {
    idx = 0;
    while (used.has(idx)) idx++;
  }
  return { ...connection, targetHandle: `input-${idx}` };
}

export interface WorkflowEditorState {
  workflowId: string | null;
  workflowName: string;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  setWorkflow: (id: string, name: string, nodes: Node[], edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNode: (nodeId: string | null) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setWorkflowName: (name: string) => void;
  reset: () => void;
}

export const useWorkflowEditorStore = create<WorkflowEditorState>((set) => ({
  workflowId: null,
  workflowName: '',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  isSaving: false,

  setWorkflow: (id, name, nodes, edges) =>
    set({ workflowId: id, workflowName: name, nodes, edges, isDirty: false }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    })),

  onConnect: (connection) =>
    set((state) => {
      const resolved = resolveMergeTargetHandle(state, connection);
      return {
        edges: addEdge(
          { ...resolved, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
          state.edges,
        ),
        isDirty: true,
      };
    }),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      isDirty: true,
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
      isDirty: true,
    })),

  setDirty: (dirty) => set({ isDirty: dirty }),
  setSaving: (saving) => set({ isSaving: saving }),
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  reset: () =>
    set({
      workflowId: null,
      workflowName: '',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      isSaving: false,
    }),
}));
