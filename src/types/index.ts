export type FlowNodeType = 'start' | 'process' | 'decision' | 'io' | 'delay' | 'end';

export interface FlowNode {
  id: string;
  label: string;
  type: FlowNodeType;
  description: string;
  x: number;
  y: number;
  stateVariable?: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface SimulationStep {
  stepIndex: number;
  nodeId: string;
  actionDescription: string;
  stateSummary: string;
}

export interface FlowSimulation {
  entryNodeId: string;
  steps: SimulationStep[];
}

export interface FlowchartData {
  id?: string;
  title: string;
  description: string;
  category: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  simulation?: FlowSimulation;
  mermaid?: string;
}

// Structure Studio Types
export type StructureModality = 'relational' | 'tree' | 'graph' | 'state_machine' | 'json_schema';

export interface TableColumn {
  name: string;
  type: string;
  isPrimary: boolean;
  nullable: boolean;
  foreignKey?: string;
  description?: string;
}

export interface TableDefinition {
  name: string;
  description: string;
  columns: TableColumn[];
  indexes?: string[];
}

export interface TableRelation {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  cardinality: 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
}

export interface TreeNodeData {
  name: string;
  type?: string;
  attributes?: Record<string, string | number | boolean>;
  children?: TreeNodeData[];
}

export interface GraphNodeData {
  id: string;
  label: string;
  category?: string;
  weight?: number;
}

export interface GraphLinkData {
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface StateDef {
  name: string;
  description: string;
  isTerminal: boolean;
}

export interface TransitionDef {
  from: string;
  to: string;
  event: string;
  guard?: string | null;
}

export interface StateMachineData {
  initialState: string;
  states: StateDef[];
  transitions: TransitionDef[];
}

export interface StructureData {
  id?: string;
  title: string;
  description: string;
  type: StructureModality;
  tables?: TableDefinition[];
  relations?: TableRelation[];
  tree?: TreeNodeData;
  graph?: {
    nodes: GraphNodeData[];
    links: GraphLinkData[];
  };
  stateMachine?: StateMachineData;
  typescriptDefinition: string;
  sqlDdl?: string;
  sampleRecords: Record<string, any>[];
}

// Analytics & Dashboard Types
export interface MetricKpi {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  insight?: string;
}

export interface AnomalyReport {
  metric: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendedAction: string;
}

export interface CorrelationInsight {
  factorA: string;
  factorB: string;
  direction: 'positive' | 'negative' | 'neutral';
  strength: string;
  explanation: string;
}

export interface AnalysisReport {
  summary: string;
  kpis: MetricKpi[];
  anomalies: AnomalyReport[];
  correlations: CorrelationInsight[];
  takeaways: string[];
  suggestedChart?: {
    type: 'area' | 'bar' | 'scatter' | 'donut';
    title: string;
    xDimension: string;
    yMetric: string;
  };
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  columns: string[];
  rows: Record<string, any>[];
  metrics: MetricKpi[];
  analysis?: AnalysisReport;
}

// AI Drive Types
export type DriveFileType = 'flowchart' | 'structure' | 'dataset' | 'report' | 'code';

export interface DriveFile {
  id: string;
  name: string;
  path: string;
  type: DriveFileType;
  sizeBytes: number;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  data: any;
  summary: string;
}

export type ActiveModule = 'tour' | 'flowchart' | 'structure' | 'dashboard' | 'drive' | 'topology';
