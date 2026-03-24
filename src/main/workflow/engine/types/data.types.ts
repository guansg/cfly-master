/** Core execution payloads (n8n-style) */

export interface INodeExecutionData {
  json: Record<string, any>;
  binary?: Record<string, IBinaryData>;
  pairedItem?: {
    item: number;
    input?: number;
  };
}

export interface IBinaryData {
  mimeType: string;
  data: string;
  dataType: 'base64' | 'filePath';
  fileName?: string;
  fileSize?: number;
  fileExtension?: string;
}

/**
 * Node output: first index = output port, second = item list.
 */
export type NodeOutput = INodeExecutionData[][] | null;
