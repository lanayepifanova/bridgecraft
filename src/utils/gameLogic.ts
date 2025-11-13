import { Node, Beam, Vehicle } from '../types/game'

export interface BridgeIssue {
  message: string
  nodeIds?: string[]
  beamIds?: string[]
}

export interface BridgeValidation {
  isValid: boolean
  errors: BridgeIssue[]
  warnings: BridgeIssue[]
}

export const validateBridge = (nodes: Node[], beams: Beam[], vehicles: Vehicle[]): BridgeValidation => {
  const validation: BridgeValidation = {
    isValid: true,
    errors: [],
    warnings: []
  }

  // Check if there are any beams
  if (beams.length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'No beams created. Build at least one beam to form a bridge.',
      nodeIds: nodes.filter(node => node.isAnchor).map(node => node.id)
    })
  }

  // Check if bridge connects anchor points
  const anchorNodes = nodes.filter(node => node.isAnchor)
  if (anchorNodes.length >= 2) {
    const startAnchor = anchorNodes[0]
    const endAnchor = anchorNodes[anchorNodes.length - 1]
    
    const isConnected = checkPathConnection(beams, startAnchor.id, endAnchor.id)
    if (!isConnected) {
      validation.warnings.push({
        message: 'Connect both anchor points so vehicles can cross.',
        nodeIds: [startAnchor.id, endAnchor.id]
      })
    }
  }

  // Check for overly stressed beams
  const criticalBeams = beams.filter(beam => beam.stress > beam.maxStress * 0.9)
  if (criticalBeams.length > 0) {
    validation.warnings.push({
      message: `${criticalBeams.length} beams are under high stress and may fail.`,
      beamIds: criticalBeams.map(beam => beam.id)
    })
  }

  // Check for unsupported nodes
  const supportedNodes = new Set<string>()
  beams.forEach(beam => {
    supportedNodes.add(beam.startNodeId)
    supportedNodes.add(beam.endNodeId)
  })

  const unsupportedNodes = nodes.filter(node => 
    !node.isFixed && !supportedNodes.has(node.id)
  )

  if (unsupportedNodes.length > 0) {
    validation.warnings.push({
      message: `${unsupportedNodes.length} nodes are not connected to any beams.`,
      nodeIds: unsupportedNodes.map(node => node.id)
    })
  }

  if (vehicles.length === 0) {
    validation.warnings.push({
      message: 'No vehicles configured for this level.'
    })
  }

  return validation
}

const checkPathConnection = (
  beams: Beam[], 
  startId: string, 
  endId: string
): boolean => {
  const visited = new Set<string>()
  const queue = [startId]
  
  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (currentId === endId) return true
    
    if (visited.has(currentId)) continue
    visited.add(currentId)
    
    const connectedBeams = beams.filter(beam => 
      beam.startNodeId === currentId || beam.endNodeId === currentId
    )
    
    connectedBeams.forEach(beam => {
      const connectedId = beam.startNodeId === currentId ? beam.endNodeId : beam.startNodeId
      if (!visited.has(connectedId)) {
        queue.push(connectedId)
      }
    })
  }
  
  return false
}

export const calculateBridgeScore = (
  beams: Beam[], 
  budgetUsed: number, 
  totalBudget: number,
  vehiclesCrossed: number
): number => {
  // Base score for successful construction
  let score = 100
  
  // Efficiency bonus for staying under budget
  const budgetEfficiency = Math.max(0, (totalBudget - budgetUsed) / totalBudget)
  score += budgetEfficiency * 200
  
  // Material efficiency - fewer beams with proper material usage
  const materialBonus = beams.reduce((bonus, beam) => {
    const efficiency = beam.stress / beam.maxStress
    
    // Bonus for using materials efficiently (not over-engineering)
    if (efficiency > 0.3 && efficiency < 0.8) {
      return bonus + 10
    }
    return bonus
  }, 0)
  score += materialBonus
  
  // Vehicle crossing bonus
  score += vehiclesCrossed * 50
  
  return Math.round(score)
}

export const generateWindForce = (force: number, nodes: Node[]): void => {
  if (force === 0 || nodes.length === 0) {
    return
  }

  // Estimate total lateral force to help balance structures
  nodes
    .filter(node => !node.isFixed)
    .forEach(node => {
      const lateralForce = force * (1 + node.y * 0.001)
      void lateralForce
    })
}

export const detectCollisions = (vehicles: Vehicle[], nodes: Node[]): boolean => {
  if (vehicles.length === 0 || nodes.length === 0) {
    return false
  }

  return vehicles.some(vehicle => 
    nodes.some(node => {
      const dx = Math.abs(node.x - vehicle.x)
      const dy = Math.abs(node.y - vehicle.y)
      return dx < 20 && dy < 20
    })
  )
}
