export enum MaterialType {
  WOOD = 'wood',
  STEEL = 'steel',
  CABLE = 'cable'
}

export interface Material {
  type: MaterialType
  name: string
  color: string
  cost: number
  density: number
  elasticity: number
  tensionStrength: number
  compressionStrength: number
}

export interface Node {
  id: string
  x: number
  y: number
  isFixed: boolean
  isAnchor?: boolean
}

export interface Beam {
  id: string
  startNodeId: string
  endNodeId: string
  material: MaterialType
  length: number
  stress: number
  maxStress: number
}

export interface Vehicle {
  id: string
  x: number
  y: number
  weight: number
  velocity: number
}

export interface Level {
  id: number
  name: string
  description: string
  budget: number
  nodes: Node[]
  vehicles: Vehicle[]
  windForce?: number
  river?: {
    width: number
    depth: number
  }
  background?: {
    sky: string
    ground: string
  }
}

export interface GameState {
  currentLevel: number
  isPaused: boolean
  showTutorial: boolean
  selectedMaterial: MaterialType
  budget: number
  score: number
  zenMode: boolean
}

export interface PhysicsState {
  world: any
  engine: any
  render: any
  nodes: Map<string, any>
  beams: Map<string, any>
}
