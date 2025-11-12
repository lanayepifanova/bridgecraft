import { Node, Beam, MaterialType, Vehicle } from '../types/game'
import { MATERIALS } from './materials'

export interface BridgeValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
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
    validation.errors.push('No beams created. Build at least one beam to form a bridge.')
  }

  // Check if bridge connects anchor points
  const anchorNodes = nodes.filter(node => node.isAnchor)
  if (anchorNodes.length >= 2) {
    const startAnchor = anchorNodes[0]
    const endAnchor = anchorNodes[anchorNodes.length - 1]
    
    const isConnected = checkPathConnection(nodes, beams, startAnchor.id, endAnchor.id)
    if (!isConnected) {
      validation.warnings.push('Bridge may not connect both anchor points. Vehicles might not be able to cross.')
    }
  }

  // Check for overly stressed beams
  const criticalBeams = beams.filter(beam => beam.stress > beam.maxStress * 0.9)
  if (criticalBeams.length > 0) {
    validation.warnings.push(`${criticalBeams.length} beams are under high stress and may fail.`)
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
    validation.warnings.push(`${unsupportedNodes.length} nodes are not connected to any beams.`)
  }

  return validation
}

const checkPathConnection = (
  nodes: Node[], 
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
    const material = MATERIALS[beam.material]
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
  // Apply wind force to exposed bridge elements
  // This would be integrated with the physics engine
}

export const detectCollisions = (vehicles: Vehicle[], nodes: Node[]): boolean => {
  // Check if vehicles collide with the bridge structure
  // Returns true if collision detected
  return false
}