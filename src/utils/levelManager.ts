import { Level } from '../types/game'

export const initializeLevels = (): Level[] => {
  return [
    {
      id: 1,
      name: "First Span",
      description: "Build a simple bridge across a small gap",
      budget: 500,
      nodes: [
        { id: 'anchor1', x: 100, y: 400, isFixed: true, isAnchor: true },
        { id: 'anchor2', x: 400, y: 400, isFixed: true, isAnchor: true }
      ],
      vehicles: [
        { id: 'car1', x: 50, y: 380, weight: 1, velocity: 2 }
      ],
      river: {
        width: 200,
        depth: 50
      }
    },
    {
      id: 2,
      name: "Double Span",
      description: "Bridge a wider gap with multiple supports",
      budget: 800,
      nodes: [
        { id: 'anchor1', x: 80, y: 400, isFixed: true, isAnchor: true },
        { id: 'support1', x: 280, y: 400, isFixed: true },
        { id: 'support2', x: 480, y: 400, isFixed: true },
        { id: 'anchor2', x: 680, y: 400, isFixed: true, isAnchor: true }
      ],
      vehicles: [
        { id: 'car1', x: 50, y: 380, weight: 1.5, velocity: 2.5 },
        { id: 'car2', x: 30, y: 380, weight: 1.2, velocity: 2 }
      ],
      river: {
        width: 400,
        depth: 80
      }
    },
    {
      id: 3,
      name: "Valley Crossing",
      description: "Navigate a deep valley with wind forces",
      budget: 1200,
      nodes: [
        { id: 'anchor1', x: 60, y: 350, isFixed: true, isAnchor: true },
        { id: 'anchor2', x: 740, y: 350, isFixed: true, isAnchor: true }
      ],
      vehicles: [
        { id: 'truck', x: 50, y: 330, weight: 3, velocity: 1.5 },
        { id: 'car1', x: 20, y: 330, weight: 1, velocity: 3 }
      ],
      windForce: 0.02,
      river: {
        width: 600,
        depth: 150
      }
    },
    {
      id: 4,
      name: "Mountain Pass",
      description: "Build through challenging terrain with heavy loads",
      budget: 2000,
      nodes: [
        { id: 'anchor1', x: 100, y: 300, isFixed: true, isAnchor: true },
        { id: 'support1', x: 350, y: 320, isFixed: true },
        { id: 'support2', x: 650, y: 340, isFixed: true },
        { id: 'anchor2', x: 900, y: 360, isFixed: true, isAnchor: true }
      ],
      vehicles: [
        { id: 'heavyTruck', x: 50, y: 280, weight: 5, velocity: 1 },
        { id: 'truck', x: 30, y: 280, weight: 2.5, velocity: 1.8 }
      ],
      windForce: 0.03,
      river: {
        width: 700,
        depth: 200
      }
    },
    {
      id: 5,
      name: "Grand Canyon",
      description: "The ultimate bridge engineering challenge",
      budget: 3000,
      nodes: [
        { id: 'anchor1', x: 50, y: 250, isFixed: true, isAnchor: true },
        { id: 'tower1', x: 200, y: 200, isFixed: true },
        { id: 'tower2', x: 600, y: 200, isFixed: true },
        { id: 'anchor2', x: 950, y: 250, isFixed: true, isAnchor: true }
      ],
      vehicles: [
        { id: 'convoy1', x: 30, y: 230, weight: 4, velocity: 1.2 },
        { id: 'convoy2', x: 10, y: 230, weight: 4, velocity: 1.2 },
        { id: 'convoy3', x: -10, y: 230, weight: 4, velocity: 1.2 }
      ],
      windForce: 0.05,
      river: {
        width: 800,
        depth: 300
      }
    }
  ]
}

export const getLevelById = (id: number): Level | undefined => {
  const levels = initializeLevels()
  return levels.find(level => level.id === id)
}

export const getNextLevel = (currentId: number): Level | undefined => {
  const levels = initializeLevels()
  return levels.find(level => level.id === currentId + 1)
}
