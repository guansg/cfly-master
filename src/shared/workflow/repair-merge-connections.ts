/**
 * Repair connection.index on inbound edges to logic:merge in the workflow definition.
 * Older graphs or missing targetHandle may persist multiple edges as index: 0, so the executor
 * overwrites the same slot and Merge only sees one branch (e.g. two edges from the same source).
 */
export function repairMergeInboundConnectionIndices(def: {
  nodes: Array<{ id: string; type: string }>;
  connections: Record<
    string,
    { main?: Array<Array<{ node: string; type: string; index: number }> | null | undefined> }
  >;
}): void {
  const mergeIds = new Set(def.nodes.filter((n) => n.type === 'logic:merge').map((n) => n.id));
  if (mergeIds.size === 0) return;

  type Incoming = {
    sourceId: string;
    outIdx: number;
    conn: { node: string; type: string; index: number };
  };
  const perMerge = new Map<string, Incoming[]>();

  for (const sourceId of Object.keys(def.connections)) {
    const outputs = def.connections[sourceId]?.main || [];
    for (let outIdx = 0; outIdx < outputs.length; outIdx++) {
      const conns = outputs[outIdx];
      if (!conns) continue;
      for (const conn of conns) {
        if (mergeIds.has(conn.node)) {
          const list = perMerge.get(conn.node) || [];
          list.push({ sourceId, outIdx, conn });
          perMerge.set(conn.node, list);
        }
      }
    }
  }

  for (const list of perMerge.values()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => {
      if (a.conn.index !== b.conn.index) return a.conn.index - b.conn.index;
      if (a.sourceId !== b.sourceId) return a.sourceId.localeCompare(b.sourceId);
      return a.outIdx - b.outIdx;
    });
    for (let i = 0; i < list.length; i++) {
      list[i].conn.index = i;
    }
  }
}
