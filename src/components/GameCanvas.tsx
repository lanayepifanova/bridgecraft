import { useRef, useEffect, useState, useCallback, useLayoutEffect, type MouseEvent } from 'react'
import { GameState, Level, Node, Beam, MaterialType } from '../types/game'
import { PhysicsEngine } from '../utils/physics'
import { MATERIALS, calculateBeamCost, getStressColor } from '../utils/materials'
import { validateBridge, type BridgeValidation } from '../utils/gameLogic'

interface SavedDesign {
  id: string
  label: string
  timestamp: number
  nodes: Node[]
  beams: Beam[]
  budget: number
}

interface ChecklistEntry {
  type: 'error' | 'warning' | 'success'
  issue: {
    message: string
    nodeIds?: string[]
    beamIds?: string[]
  }
}

interface GameCanvasProps {
  gameState: GameState
  levels: Level[]
  onSpendBudget: (cost: number) => void
  onResetBudget: () => void
  onRefundBudget: (amount: number) => void
  onRestoreBudget: (amount: number) => void
}

const MAX_SAVED_DESIGNS = 3
const MAX_HISTORY = 25
const ISO_GRID_SPACING = 35
const HINT_FADE_THRESHOLD = 3
const HINT_FADE_DURATION = 500

const GameCanvas = ({
  gameState,
  levels,
  onSpendBudget,
  onResetBudget,
  onRefundBudget,
  onRestoreBudget
}: GameCanvasProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const physicsEngineRef = useRef<PhysicsEngine | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [beams, setBeams] = useState<Beam[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showStressMap, setShowStressMap] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 })
  const [isSimulating, setIsSimulating] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  const [deleteMode, setDeleteMode] = useState(false)
  const [showDeleteHint, setShowDeleteHint] = useState(true)
  const [bridgeValidation, setBridgeValidation] = useState<BridgeValidation | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredBeamId, setHoveredBeamId] = useState<string | null>(null)
  const [pointerToast, setPointerToast] = useState<{ message: string, x: number, y: number } | null>(null)
  const pointerToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [refundPreview, setRefundPreview] = useState<{ amount: number, x: number, y: number } | null>(null)
  const [budgetFlash, setBudgetFlash] = useState(false)
  const [budgetDelta, setBudgetDelta] = useState<number | null>(null)
  const prevBudgetRef = useRef(gameState.budget)
  const [highlightTargets, setHighlightTargets] = useState<{ nodes: string[], beams: string[] }>({ nodes: [], beams: [] })
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyRef = useRef<SavedDesign[]>([])
  const futureRef = useRef<SavedDesign[]>([])
  const [historyMeta, setHistoryMeta] = useState({ undo: 0, redo: 0 })
  const [hintPhase, setHintPhase] = useState<'visible' | 'fading' | 'hidden'>('visible')
  const hintFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const beamsPlacedRef = useRef(0)

  const currentLevel = levels[gameState.currentLevel]

  const initializeLevel = useCallback(() => {
    if (!currentLevel || !physicsEngineRef.current) return

    physicsEngineRef.current.reset()
    clearHistory()
    
    // Initialize anchor nodes
    const initialNodes = [...currentLevel.nodes]
    setNodes(initialNodes)
    
    physicsEngineRef.current.initialize(initialNodes)
    setBeams([])
    setIsSimulating(false)
  }, [currentLevel])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    physicsEngineRef.current = new PhysicsEngine(canvas)

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(rect.width, 1)
      const height = Math.max(rect.height, 1)
      canvas.width = width
      canvas.height = height
      setCanvasSize({ width, height })
    }

    updateCanvasSize()

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateCanvasSize())
      : null
    resizeObserver?.observe(canvas)
    window.addEventListener('resize', updateCanvasSize)

    initializeLevel()

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [initializeLevel])

  useEffect(() => {
    initializeLevel()
  }, [gameState.currentLevel, initializeLevel])

  useEffect(() => {
    setSavedDesigns([])
    setDeleteMode(false)
    setShowDeleteHint(true)
  }, [gameState.currentLevel])

  useEffect(() => {
    if (!currentLevel) {
      setBridgeValidation(null)
      return
    }

    const validation = validateBridge(nodes, beams, currentLevel.vehicles)
    setBridgeValidation(validation)
  }, [nodes, beams, currentLevel])

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
      if (hintFadeTimeoutRef.current) {
        clearTimeout(hintFadeTimeoutRef.current)
      }
      if (pointerToastTimeoutRef.current) {
        clearTimeout(pointerToastTimeoutRef.current)
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const previous = prevBudgetRef.current
    if (previous !== gameState.budget) {
      setBudgetFlash(true)
      setBudgetDelta(gameState.budget - previous)
      prevBudgetRef.current = gameState.budget
      const flashTimeout = setTimeout(() => setBudgetFlash(false), 400)
      const deltaTimeout = setTimeout(() => setBudgetDelta(null), 800)
      return () => {
        clearTimeout(flashTimeout)
        clearTimeout(deltaTimeout)
      }
    }
  }, [gameState.budget])

  useEffect(() => {
    let rafId: number

    const updateBeamStress = () => {
      if (!physicsEngineRef.current) {
        rafId = requestAnimationFrame(updateBeamStress)
        return
      }

      setBeams(prevBeams => {
        if (prevBeams.length === 0) return prevBeams

        let changed = false
        const nextBeams = prevBeams.map(beam => {
          const stress = physicsEngineRef.current?.calculateStress(beam.id) ?? 0
          const clampedStress = Math.max(0, stress)
          if (Math.abs(clampedStress - beam.stress) > 0.5) {
            changed = true
            return { ...beam, stress: clampedStress }
          }
          return beam
        })

        return changed ? nextBeams : prevBeams
      })

      rafId = requestAnimationFrame(updateBeamStress)
    }

    rafId = requestAnimationFrame(updateBeamStress)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])
  const showToast = (message: string) => {
    setToastMessage(message)
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
    }, 2000)
  }

  const cloneNodes = (list: Node[]): Node[] => list.map(node => ({ ...node }))
  const cloneBeams = (list: Beam[]): Beam[] => list.map(beam => ({ ...beam }))
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const rotatePoint = (x: number, y: number, angle: number): { x: number, y: number } => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    }
  }

  const snapToIsometricGrid = (x: number, y: number): { x: number, y: number } => {
    const angle = Math.PI / 4
    const rotated = rotatePoint(x, y, -angle)
    const snappedX = Math.round(rotated.x / ISO_GRID_SPACING) * ISO_GRID_SPACING
    const snappedY = Math.round(rotated.y / ISO_GRID_SPACING) * ISO_GRID_SPACING
    return rotatePoint(snappedX, snappedY, angle)
  }

  const syncHistoryMeta = () => {
    setHistoryMeta({
      undo: historyRef.current.length,
      redo: futureRef.current.length
    })
  }

  const captureSnapshot = (
    nodesSnapshot: Node[] = nodes,
    beamsSnapshot: Beam[] = beams,
    budgetSnapshot: number = gameState.budget
  ): SavedDesign => ({
    id: `history-${Date.now()}`,
    label: 'History',
    timestamp: Date.now(),
    nodes: cloneNodes(nodesSnapshot),
    beams: cloneBeams(beamsSnapshot),
    budget: budgetSnapshot
  })

  const pushHistorySnapshot = (
    nodesSnapshot?: Node[],
    beamsSnapshot?: Beam[],
    budgetSnapshot?: number
  ) => {
    const snapshot = captureSnapshot(nodesSnapshot, beamsSnapshot, budgetSnapshot)
    historyRef.current = [...historyRef.current, snapshot].slice(-MAX_HISTORY)
    futureRef.current = []
    syncHistoryMeta()
  }

  const clearHistory = () => {
    historyRef.current = []
    futureRef.current = []
    syncHistoryMeta()
  }

  const saveCurrentDesign = (label: string) => {
    const snapshot: SavedDesign = {
      id: `design-${Date.now()}`,
      label,
      timestamp: Date.now(),
      nodes: cloneNodes(nodes),
      beams: cloneBeams(beams),
      budget: gameState.budget
    }

    setSavedDesigns(prev => {
      const updated = [snapshot, ...prev].slice(0, MAX_SAVED_DESIGNS)
      return updated
    })
  }

  const requestHintFadeOut = () => {
    if (hintPhase !== 'visible' || hintFadeTimeoutRef.current) return
    setHintPhase('fading')
    hintFadeTimeoutRef.current = setTimeout(() => {
      setHintPhase('hidden')
      hintFadeTimeoutRef.current = null
    }, HINT_FADE_DURATION)
  }

  const showPointerToast = (message: string, clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    setPointerToast({ message, x, y })
    if (pointerToastTimeoutRef.current) {
      clearTimeout(pointerToastTimeoutRef.current)
    }
    pointerToastTimeoutRef.current = setTimeout(() => {
      setPointerToast(null)
    }, 1000)
  }

  const triggerHighlight = (nodeIds?: string[], beamIds?: string[]) => {
    if ((!nodeIds || nodeIds.length === 0) && (!beamIds || beamIds.length === 0)) return
    setHighlightTargets({
      nodes: nodeIds ?? [],
      beams: beamIds ?? []
    })
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightTargets({ nodes: [], beams: [] })
    }, 2000)
  }

  const pointToSegmentDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const dx = x2 - x1
    const dy = y2 - y1

    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1)
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    t = Math.max(0, Math.min(1, t))

    const closestX = x1 + t * dx
    const closestY = y1 + t * dy

    return Math.hypot(px - closestX, py - closestY)
  }

  const findBeamNearPoint = (x: number, y: number, threshold = 8): Beam | null => {
    let match: Beam | null = null
    let minDistance = threshold

    beams.forEach(beam => {
      const start = nodes.find(node => node.id === beam.startNodeId)
      const end = nodes.find(node => node.id === beam.endNodeId)
      if (!start || !end) return

      const distance = pointToSegmentDistance(x, y, start.x, start.y, end.x, end.y)
      if (distance < minDistance) {
        minDistance = distance
        match = beam
      }
    })

    return match
  }

  const removeBeam = (beam: Beam, showMessage = true) => {
    pushHistorySnapshot()
    const updatedBeams = beams.filter(b => b.id !== beam.id)
    setBeams(updatedBeams)
    physicsEngineRef.current?.removeBeam(beam.id)
    const refund = calculateBeamCost(beam.length, beam.material)
    onRefundBudget(refund)
    setSelectedNode(null)
    setShowDeleteHint(false)
    setRefundPreview(null)
    if (showMessage) {
      showToast(`Beam removed (+$${refund})`)
    }
  }

  const loadDesign = (design: SavedDesign) => {
    if (!physicsEngineRef.current) return

    const clonedNodes = cloneNodes(design.nodes)
    const clonedBeams = cloneBeams(design.beams)

    physicsEngineRef.current.reset()
    physicsEngineRef.current.initialize(clonedNodes)

    clonedBeams.forEach(beam => {
      const start = clonedNodes.find(node => node.id === beam.startNodeId)
      const end = clonedNodes.find(node => node.id === beam.endNodeId)
      if (start && end) {
        physicsEngineRef.current?.addBeam(beam, start, end)
      }
    })

    setNodes(clonedNodes)
    setBeams(clonedBeams)
    setIsSimulating(false)
    setSelectedNode(null)
  }

  const handleRestoreDesign = (designId?: string) => {
    const design = designId
      ? savedDesigns.find(snapshot => snapshot.id === designId)
      : savedDesigns[0]

    if (!design) {
      showToast('No saved designs available')
      return
    }

    pushHistorySnapshot()
    loadDesign(design)
    onRestoreBudget(design.budget)
    showToast(`Restored ${design.label}`)
  }

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

  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isSimulating) return
    const coords = getCanvasCoordinates(e)
    setCursorPosition(coords)
    const hovered = findNearestNode(coords.x, coords.y, 18)
    setHoveredNodeId(hovered?.id ?? null)

    if (deleteMode) {
      const beamTarget = findBeamNearPoint(coords.x, coords.y, 12)
      setHoveredBeamId(beamTarget?.id ?? null)
      if (beamTarget && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const refundAmount = calculateBeamCost(beamTarget.length, beamTarget.material)
        setRefundPreview({
          amount: refundAmount,
          x: e.clientX - rect.left + 12,
          y: e.clientY - rect.top - 12
        })
      } else {
        setRefundPreview(null)
      }
    } else {
      setHoveredBeamId(null)
      setRefundPreview(null)
    }
  }

  const handleCanvasMouseLeave = () => {
    setCursorPosition(null)
    setHoveredNodeId(null)
    setHoveredBeamId(null)
    setRefundPreview(null)
  }

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isSimulating) return

    const { x, y } = getCanvasCoordinates(e)
    const shouldDelete = deleteMode || e.shiftKey

    if (shouldDelete) {
      const beamToRemove = findBeamNearPoint(x, y, 12)
      if (beamToRemove) {
        removeBeam(beamToRemove)
      } else if (deleteMode) {
        showPointerToast('No beam nearby', e.clientX, e.clientY)
      }
      setShowDeleteHint(false)
      return
    }

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
        if (cost > gameState.budget) {
          showToast('Not enough budget for that beam')
          showPointerToast('Over budget', e.clientX, e.clientY)
          return
        }

        const newBeam: Beam = {
          id: beamId,
          startNodeId: selectedNode,
          endNodeId: clickedNode.id,
          material: gameState.selectedMaterial,
          length,
          stress: 0,
          maxStress: MATERIALS[gameState.selectedMaterial].tensionStrength
        }

        pushHistorySnapshot()
        const updatedBeams = [...beams, newBeam]
        setBeams(updatedBeams)
        physicsEngineRef.current?.addBeam(newBeam, 
          nodes.find(n => n.id === selectedNode)!, 
          clickedNode
        )
        onSpendBudget(cost)
        beamsPlacedRef.current += 1
        if (beamsPlacedRef.current >= HINT_FADE_THRESHOLD) {
          requestHintFadeOut()
        }
        setSelectedNode(null)
        return
      }

      setSelectedNode(clickedNode.id)
    } else {
      // Add new node
      const snappedPoint = snapToIsometricGrid(x, y)
      const newNode: Node = {
        id: `node-${Date.now()}`,
        x: snappedPoint.x,
        y: snappedPoint.y,
        isFixed: false
      }
      
      pushHistorySnapshot()
      const updatedNodes = [...nodes, newNode]
      setNodes(updatedNodes)
      physicsEngineRef.current?.addNode(newNode)
      setSelectedNode(newNode.id)
    }
  }

  const handleStartSimulation = () => {
    if (!physicsEngineRef.current || !currentLevel) return

    // Add vehicles
    currentLevel.vehicles.forEach(vehicle => {
      physicsEngineRef.current!.addVehicle(vehicle.x, vehicle.y, vehicle.weight)
    })

    physicsEngineRef.current.startSimulation()
    setIsSimulating(true)
  }

  const handleReset = () => {
    const hadBeams = beams.length > 0
    if (hadBeams) {
      const label = `Before reset #${savedDesigns.length + 1}`
      saveCurrentDesign(label)
    }
    onResetBudget()
    initializeLevel()
    showToast(hadBeams ? 'Design saved. Level reset.' : 'Level reset.')
    setDeleteMode(false)
  }

  const handleToggleStressMap = () => {
    setShowStressMap(!showStressMap)
  }

  const handleToggleDeleteMode = () => {
    setDeleteMode(prev => !prev)
    setShowDeleteHint(false)
    setHoveredBeamId(null)
    setRefundPreview(null)
  }

  const handleUndo = () => {
    const previous = historyRef.current.pop()
    if (!previous) return
    futureRef.current = [...futureRef.current, captureSnapshot()]
    loadDesign(previous)
    onRestoreBudget(previous.budget)
    syncHistoryMeta()
  }

  const handleRedo = () => {
    const next = futureRef.current.pop()
    if (!next) return
    historyRef.current = [...historyRef.current, captureSnapshot()]
    loadDesign(next)
    onRestoreBudget(next.budget)
    syncHistoryMeta()
  }

  const canRestore = savedDesigns.length > 0
  const deleteModeButtonClasses = `btn-secondary ${
    deleteMode ? 'border-red-400 bg-red-50 text-red-700' : ''
  }`

  const checklistItems: ChecklistEntry[] = bridgeValidation
    ? [
        ...bridgeValidation.errors.map(issue => ({ type: 'error' as const, issue })),
        ...bridgeValidation.warnings.map(issue => ({ type: 'warning' as const, issue }))
      ]
    : []

  const checklistDisplayItems =
    checklistItems.length > 0
      ? checklistItems
      : [
          {
            type: 'success' as const,
            issue: {
              message:
              beams.length > 0
                ? 'Bridge passes basic checks.'
                : 'Add beams connecting the anchors to begin.'
            }
          }
        ]

  const statusIcon: Record<'error' | 'warning' | 'success', string> = {
    error: '⚠️',
    warning: '💡',
    success: '✅'
  }

  const statusColor = {
    error: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-sage-600'
  }

  const hasBlockingErrors = bridgeValidation ? !bridgeValidation.isValid : false
  const isTestDisabled = isSimulating || hasBlockingErrors
  const selectedNodeData = selectedNode ? nodes.find(node => node.id === selectedNode) : null
  const previewTarget = (() => {
    if (!selectedNodeData || deleteMode || isSimulating) return null
    if (hoveredNodeId && hoveredNodeId !== selectedNode) {
      const targetNode = nodes.find(node => node.id === hoveredNodeId)
      if (targetNode) {
        return { x: targetNode.x, y: targetNode.y, snapped: true }
      }
    }
    if (cursorPosition) {
      const snappedPoint = snapToIsometricGrid(cursorPosition.x, cursorPosition.y)
      return { x: snappedPoint.x, y: snappedPoint.y, snapped: false }
    }
    return null
  })()

  const buildHintMessage = (() => {
    if (deleteMode || isSimulating) return null
    if (!selectedNodeData) {
      return 'Click an anchor or existing node to start a beam.'
    }
    if (hoveredNodeId && hoveredNodeId !== selectedNode) {
      return 'Click again to connect the highlighted node.'
    }
    return 'Move to another node and click to finish the beam.'
  })()
  const shouldShowBuildHint = Boolean(buildHintMessage) && hintPhase !== 'hidden'
  const hintOpacityClass = hintPhase === 'fading' ? 'opacity-0' : 'opacity-100'
  const levelBackgroundStyle = currentLevel?.background
    ? {
        background: `linear-gradient(180deg, ${currentLevel.background.sky} 0%, ${currentLevel.background.sky} 45%, ${currentLevel.background.ground} 100%)`
      }
    : undefined

  return (
    <div className="relative h-full" ref={wrapperRef} style={levelBackgroundStyle}>
      <canvas
        ref={canvasRef}
        className={`game-canvas w-full h-full ${deleteMode ? 'cursor-no-drop' : 'cursor-crosshair'}`}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
      
      {/* Design overlay so players can see nodes/beams while building */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        preserveAspectRatio="none"
      >
        {beams.map(beam => {
          const start = nodes.find(node => node.id === beam.startNodeId)
          const end = nodes.find(node => node.id === beam.endNodeId)
          if (!start || !end) return null

          const isHighlightedBeam = highlightTargets.beams.includes(beam.id)
          const isHoveredDelete = deleteMode && hoveredBeamId === beam.id
          const color = isHighlightedBeam
            ? '#f97316'
            : isHoveredDelete
            ? '#dc2626'
            : showStressMap
            ? getStressColor(beam.stress, beam.maxStress)
            : MATERIALS[beam.material].color

          return (
            <line
              key={beam.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={color}
              strokeWidth={(beam.material === MaterialType.CABLE ? 2 : 4) + (isHoveredDelete ? 1 : 0)}
              strokeLinecap="round"
              strokeDasharray={isHighlightedBeam ? '4 4' : isHoveredDelete ? '1 6' : undefined}
              opacity={isHoveredDelete ? 1 : 0.9}
            />
          )
        })}

        {nodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.isAnchor ? 8 : 6}
            fill={node.isAnchor ? '#EF4444' : node.isFixed ? '#6B7280' : '#ffffff'}
            stroke={
              highlightTargets.nodes.includes(node.id)
                ? '#f97316'
                : selectedNode === node.id
                ? '#2563eb'
                : hoveredNodeId === node.id
                ? '#a855f7'
                : '#9CA3AF'
            }
            strokeWidth={
              highlightTargets.nodes.includes(node.id)
                ? 4
                : selectedNode === node.id || hoveredNodeId === node.id
                ? 3
                : 2
            }
            opacity={0.95}
          />
        ))}

        {selectedNodeData && previewTarget && (
          <line
            x1={selectedNodeData.x}
            y1={selectedNodeData.y}
            x2={previewTarget.x}
            y2={previewTarget.y}
            stroke={previewTarget.snapped ? '#2563eb' : '#6B7280'}
            strokeWidth={3}
            strokeDasharray="6 6"
            opacity={0.7}
          />
        )}
      </svg>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 space-y-3">
        <div className="card bg-white/90 backdrop-blur-sm">
          <h3 className="font-space font-semibold text-lg mb-2">{currentLevel?.name}</h3>
          <p className="text-sm text-stone-600 mb-3">{currentLevel?.description}</p>
          <div className="text-sm space-y-1">
            <div>
              Budget:{' '}
              <span
                className={`font-semibold transition-colors ${
                  budgetFlash ? 'text-sage-700' : 'text-stone-800'
                }`}
              >
                ${gameState.budget}
              </span>
              {budgetDelta !== null && budgetDelta !== 0 && (
                <span
                  className={`ml-2 text-xs font-semibold ${
                    budgetDelta > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {budgetDelta > 0 ? '+' : '-'}${Math.abs(budgetDelta)}
                </span>
              )}
            </div>
            <div>Beams: <span className="font-medium">{beams.length}</span></div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleStartSimulation}
            disabled={isTestDisabled}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={handleToggleDeleteMode}
            className={deleteModeButtonClasses}
          >
            {deleteMode ? 'Exit Delete Mode' : 'Delete Mode'}
          </button>
          <button 
            onClick={() => handleRestoreDesign()}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canRestore}
          >
            Restore Latest
          </button>
          <button 
            onClick={handleUndo}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={historyMeta.undo === 0}
          >
            Undo
          </button>
          <button 
            onClick={handleRedo}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={historyMeta.redo === 0}
          >
            Redo
          </button>
          <button 
            onClick={handleToggleStressMap}
            className="btn-secondary"
          >
            {showStressMap ? 'Hide' : 'Show'} Stress
          </button>
        </div>
        {hasBlockingErrors && (
          <p className="text-xs text-red-600">Complete the checklist before testing.</p>
        )}

        {savedDesigns.length > 0 && (
          <div className="card bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Saved Designs</h4>
              <span className="text-xs text-stone-500">Last {savedDesigns.length} of {MAX_SAVED_DESIGNS}</span>
            </div>
            <div className="space-y-2">
              {savedDesigns.map((design, index) => (
                <button
                  key={design.id}
                  onClick={() => handleRestoreDesign(design.id)}
                  className="w-full text-left border border-stone-200 rounded-lg p-2 hover:border-sage-400 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{design.label || `Snapshot ${index + 1}`}</span>
                    <span className="text-xs text-stone-500">{formatTimestamp(design.timestamp)}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    Budget saved: ${design.budget}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checklist & Legends */}
      <div className="absolute top-4 right-4 w-72 space-y-3">
        <div className="card bg-white/90 backdrop-blur-sm">
          <h4 className="font-semibold mb-1">Design Checklist</h4>
          <p className="text-xs text-stone-500 mb-3">
            Keep building until everything is checked off.
          </p>
          <ul className="space-y-2 text-sm">
            {checklistDisplayItems.map((item, idx) => (
              <li key={`${item.type}-${idx}`} className="flex items-start space-x-2">
                <span className={`${statusColor[item.type]} text-lg leading-none`}>
                  {statusIcon[item.type]}
                </span>
                <div className="flex-1">
                  <p className={`${item.type === 'error' ? 'text-red-700' : 'text-stone-700'}`}>
                    {item.issue.message}
                  </p>
                  {(item.issue.nodeIds?.length || item.issue.beamIds?.length) && (
                    <button
                      type="button"
                      onClick={() => triggerHighlight(item.issue.nodeIds, item.issue.beamIds)}
                      className="text-xs text-sage-700 hover:text-sage-900 transition-colors mt-1 underline"
                    >
                      Highlight issue
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {shouldShowBuildHint && (
        <div className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur border border-stone-200 shadow text-sm text-stone-700 transition-opacity duration-500 ${hintOpacityClass}`}>
          {buildHintMessage}
        </div>
      )}

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

      {showDeleteHint && !deleteMode && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-white/90 backdrop-blur-sm shadow border border-stone-200 flex items-center space-x-2 text-sm text-stone-700">
          <span>Pro tip: Shift-click or tap <span className="font-semibold">Delete Mode</span> to remove beams.</span>
          <button
            onClick={() => setShowDeleteHint(false)}
            className="text-sage-700 hover:underline text-xs"
          >
            Got it
          </button>
        </div>
      )}

      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500 text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {pointerToast && (
        <div
          className="pointer-events-none absolute px-2 py-1 rounded bg-red-500 text-white text-xs shadow-lg"
          style={{ left: pointerToast.x, top: pointerToast.y }}
        >
          {pointerToast.message}
        </div>
      )}

      {refundPreview && deleteMode && (
        <div
          className="pointer-events-none absolute px-2 py-1 rounded bg-emerald-500 text-white text-xs shadow"
          style={{ left: refundPreview.x, top: refundPreview.y }}
        >
          Refund +${refundPreview.amount}
        </div>
      )}
    </div>
  )
}

export default GameCanvas
