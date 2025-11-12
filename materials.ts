import { Material, MaterialType } from '../types/game'

export const MATERIALS: Record<MaterialType, Material> = {
  [MaterialType.WOOD]: {
    type: MaterialType.WOOD,
    name: 'Wood',
    color: '#8B4513',
    cost: 10,
    density: 0.5,
    elasticity: 0.3,
    tensionStrength: 40,
    compressionStrength: 35
  },
  [MaterialType.STEEL]: {
    type: MaterialType.STEEL,
    name: 'Steel',
    color: '#71717A',
    cost: 50,
    density: 2.0,
    elasticity: 0.1,
    tensionStrength: 250,
    compressionStrength: 250
  },
  [MaterialType.CABLE]: {
    type: MaterialType.CABLE,
    name: 'Cable',
    color: '#4A5568',
    cost: 30,
    density: 0.2,
    elasticity: 0.05,
    tensionStrength: 200,
    compressionStrength: 5
  }
}

export const getStressColor = (stress: number, maxStress: number): string => {
  const ratio = stress / maxStress
  
  if (ratio < 0.3) return '#3B82F6' // blue - low stress
  if (ratio < 0.6) return '#F59E0B' // amber - medium stress
  if (ratio < 0.9) return '#EF4444' // red - high stress
  return '#DC2626' // dark red - critical stress
}

export const calculateBeamCost = (length: number, material: MaterialType): number => {
  const materialData = MATERIALS[material]
  return Math.ceil(length * materialData.cost)
}