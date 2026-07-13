export type NodeType =
  | 'entrance' | 'hallway' | 'room' | 'elevator' | 'stairs'
  | 'ramp' | 'restroom' | 'facility';

export interface NavigationNode {
  id: string;
  name: string;
  floor: number;
  x: number;
  y: number;
  type: NodeType;
  description?: string;
}

export type EdgeType = 'corridor' | 'elevator' | 'stairs' | 'ramp' | 'door';

export interface NavigationEdge {
  id: string;
  from: string;
  to: string;
  distance: number;
  accessible: boolean;
  type: EdgeType;
  instruction: string;
  slope?: number;
  width?: number;
  hasObstacle?: boolean;
  bidirectional?: boolean;
}

export type TravelMode = 'normal' | 'wheelchair';

export interface RouteResult {
  nodeIds: string[];
  edgeIds: string[];
  totalCost: number;
}

export interface RouteStep {
  edge: NavigationEdge;
  from: NavigationNode;
  to: NavigationNode;
}

export interface DataValidationResult {
  valid: boolean;
  errors: string[];
}
