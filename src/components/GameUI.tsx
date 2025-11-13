import { useState, type ReactNode } from 'react'
import { GameState, Level, MaterialType } from '../types/game'
import { MATERIALS } from '../utils/materials'

interface GameUIProps {
  gameState: GameState
  levels: Level[]
  onTogglePause: () => void
  onSelectMaterial: (material: MaterialType) => void
  onToggleZenMode: () => void
  onNextLevel: () => void
}

const GameUI = ({
  gameState,
  levels,
  onTogglePause,
  onSelectMaterial,
  onToggleZenMode,
  onNextLevel
}: GameUIProps) => {
  const currentLevel = levels[gameState.currentLevel]
  const progress = ((gameState.currentLevel + 1) / levels.length) * 100
  const [openSections, setOpenSections] = useState({
    build: true,
    economy: true,
    level: true
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const Section = ({
    id,
    title,
    children
  }: {
    id: keyof typeof openSections
    title: string
    children: ReactNode
  }) => (
    <div className="card">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between text-left font-semibold text-stone-800"
      >
        <span>{title}</span>
        <span className="text-sm text-stone-500">{openSections[id] ? '−' : '+'}</span>
      </button>
      {openSections[id] && <div className="mt-3 space-y-3 text-sm text-stone-700">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-6 pb-16">
      {/* Pinned Header + Materials */}
      <div className="sticky top-0 bg-white pb-4 z-10 space-y-4">
        <div className="text-center">
          <h1 className="font-space font-bold text-2xl text-stone-800 mb-1">Bridgecraft</h1>
          <p className="text-stone-600 text-sm">Physics-Based Bridge Building</p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Level Progress</h3>
          <div className="w-full bg-stone-200 rounded-full h-2 mb-2">
            <div 
              className="bg-sage-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-stone-600">
            Level {gameState.currentLevel + 1} of {levels.length}
          </div>
        </div>

        <div className="card shadow-md">
          <h3 className="font-semibold mb-3">Materials</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.values(MaterialType).map(type => {
              const material = MATERIALS[type]
              const isSelected = gameState.selectedMaterial === type
              
              return (
                <button
                  key={type}
                  onClick={() => onSelectMaterial(type)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected 
                      ? 'border-sage-600 bg-sage-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: material.color }}
                      />
                      <span className="font-medium">{material.name}</span>
                    </div>
                    <span className="text-sm text-stone-500">${material.cost}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-600">
                    Strength: {material.tensionStrength} | Elasticity: {material.elasticity}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Section id="build" title="Build Controls">
        <div className="space-y-2">
          <button 
            onClick={onTogglePause}
            className="w-full btn-primary"
          >
            {gameState.isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button 
            onClick={onToggleZenMode}
            className="w-full btn-secondary"
          >
            {gameState.zenMode ? 'Exit Zen Mode' : 'Zen Mode'}
          </button>
        </div>
        <div className="text-stone-600 space-y-1">
          <p>• Click nodes to start a beam, then snap to another node.</p>
          <p>• Shift-click or enable Delete Mode to remove beams and earn refunds.</p>
          <p>• Undo/Redo lets you iterate quickly.</p>
        </div>
      </Section>

      <Section id="economy" title="Economy & Progress">
        {!gameState.zenMode ? (
          <div>
            <p className="text-xs uppercase text-stone-500">Budget</p>
            <p className="text-2xl font-bold text-sage-600">${gameState.budget}</p>
            <p className="text-xs text-stone-500">Spend wisely; refunds return unused funds.</p>
          </div>
        ) : (
          <p className="text-sm text-sage-600">Zen Mode gives unlimited budget for freeform builds.</p>
        )}

        {gameState.currentLevel < levels.length - 1 && (
          <button 
            onClick={onNextLevel}
            className="w-full btn-primary"
          >
            Next Level
          </button>
        )}
      </Section>

      {currentLevel && (
        <Section id="level" title="Level Details">
          <div>
            <h4 className="font-medium text-lg">{currentLevel.name}</h4>
            <p className="text-sm text-stone-600 mb-2">{currentLevel.description}</p>
          </div>
          
          {currentLevel.windForce && (
            <div className="text-sm text-stone-600">
              <span className="font-medium">Wind Force:</span> {currentLevel.windForce}
            </div>
          )}
          
          {currentLevel.river && (
            <div className="text-sm text-stone-600">
              <span className="font-medium">River Width:</span> {currentLevel.river.width}m
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

export default GameUI
