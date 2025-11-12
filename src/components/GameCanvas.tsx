import { useRef, useEffect, useState, useCallback, type MouseEvent } from 'react'
import { GameState, Level, Node, Beam, MaterialType } from '../types/game'
import { PhysicsEngine } from '../utils/physics'
import { MATERIALS, calculateBeamCost } from '../utils/materials'

interface GameCanvasProps {
  gameState: GameState
  levels: Level[]
}

const GameCanvas = ({ gameState, levels }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const physicsEngineRef = useRef<PhysicsEngine | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [beams, setBeams] = useState<Beam[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showStressMap, setShowStressMap] = useState(true)

  const currentLevel = levels[gameState.currentLevel]

  const initializeLevel = useCallback(() => {
    if (!currentLevel || !physicsEngineRef.current) return

    physicsEngineRef.current.reset()
    
    // Initialize anchor nodes
    const initialNodes = [...currentLevel.nodes]
    setNodes(initialNodes)
    
    physicsEngineRef.current.initialize(initialNodes)
    setBeams([])
  }, [currentLevel])

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      
      physicsEngineRef.current = new PhysicsEngine(canvas)
      initializeLevel()
    }
  }, [initializeLevel])

  useEffect(() => {
    initializeLevel()
  }, [gameState.currentLevel, initializeLevel])

  const getCanvasCoordinates = (e: MouseEvent<HTMLCanvasElement>): { x: number, y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const findNearestNode = (x: number, y: number, threshold: number = 20): Node | null => {
    let nearestNode: Node | null = null
    let minDistance = threshold

    nodes.forEach(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2)
      if (distance < minDistance) {
        minDistance = distance
        nearestNode = node
      }
    })

    return nearestNode
  }

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (gameState.isPlaying) return

    const { x, y } = getCanvasCoordinates(e)
    const clickedNode = findNearestNode(x, y)

    if (clickedNode) {
      if (selectedNode && selectedNode !== clickedNode.id) {
        // Create beam between selected nodes
        const beamId = `beam-${Date.now()}`
        const length = Math.sqrt(
          (nodes.find(n => n.id === selectedNode)!.x - clickedNode.x) ** 2 +
          (nodes.find(n => n.id === selectedNode)!.y - clickedNode.y) ** 2
        )
        
        const cost = calculateBeamCost(length, gameState.selectedMaterial)
        if (cost <= gameState.budget) {
          const newBeam: Beam = {
            id: beamId,
            startNodeId: selectedNode,
            endNodeId: clickedNode.id,
            material: gameState.selectedMaterial,
            stress: 0,
            maxStress: MATERIALS[gameState.selectedMaterial].tensionStrength
          }

          setBeams(prev => [...prev, newBeam])
          physicsEngineRef.current?.addBeam(newBeam, 
            nodes.find(n => n.id === selectedNode)!, 
            clickedNode
          )
        }
        
        setSelectedNode(null)
      } else {
        setSelectedNode(clickedNode.id)
      }
    } else {
      // Add new node
      const newNode: Node = {
        id: `node-${Date.now()}`,
        x,
        y,
        isFixed: false
      }
      
      setNodes(prev => [...prev, newNode])
      setSelectedNode(newNode.id)
    }
  }

  const handleStartSimulation = () => {
    if (!physicsEngineRef.current) return

    // Add vehicles
    currentLevel.vehicles.forEach(vehicle => {
      physicsEngineRef.current!.addVehicle(vehicle.x, vehicle.y, vehicle.weight)
    })

    physicsEngineRef.current.startSimulation()
  }

  const handleReset = () => {
    initializeLevel()
  }

  const handleToggleStressMap = () => {
    setShowStressMap(!showStressMap)
  }

  return (
    <div className="relative h-full">
      <canvas
        ref={canvasRef}
        className="game-canvas w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="card bg-white/90 backdrop-blur-sm">
          <h3 className="font-space font-semibold text-lg mb-2">{currentLevel?.name}</h3>
          <p className="text-sm text-stone-600 mb-3">{currentLevel?.description}</p>
          <div className="text-sm space-y-1">
            <div>Budget: <span className="font-medium">${gameState.budget}</span></div>
            <div>Beams: <span className="font-medium">{beams.length}</span></div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleStartSimulation}
            disabled={gameState.isPlaying}
            className="btn-primary disabled:opacity-50"
          >
            Test Bridge
          </button>
          <button 
            onClick={handleReset}
            className="btn-secondary"
          >
            Reset
          </button>
          <button 
            onClick={handleToggleStressMap}
            className="btn-secondary"
          >
            {showStressMap ? 'Hide' : 'Show'} Stress
          </button>
        </div>
      </div>

      {/* Material Legend */}
      <div className="absolute bottom-4 left-4 card bg-white/90 backdrop-blur-sm">
        <h4 className="font-semibold mb-2">Materials</h4>
        <div className="space-y-1 text-sm">
          {Object.values(MaterialType).map(type => (
            <div key={type} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: MATERIALS[type].color }}
              />
              <span>{MATERIALS[type].name}</span>
              <span className="text-stone-500">${MATERIALS[type].cost}/unit</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stress Legend */}
      {showStressMap && (
        <div className="absolute bottom-4 right-4 card bg-white/90 backdrop-blur-sm">
          <h4 className="font-semibold mb-2">Stress Levels</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>Low Stress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span>Medium Stress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>High Stress</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameCanvas
