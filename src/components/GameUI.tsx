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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-space font-bold text-2xl text-stone-800 mb-2">Bridgecraft</h1>
        <p className="text-stone-600 text-sm">Physics-Based Bridge Building</p>
      </div>

      {/* Level Progress */}
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

      {/* Game Controls */}
      <div className="card">
        <h3 className="font-semibold mb-3">Game Controls</h3>
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
      </div>

      {/* Materials */}
      <div className="card">
        <h3 className="font-semibold mb-3">Materials</h3>
        <div className="space-y-2">
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

      {/* Budget */}
      {!gameState.zenMode && (
        <div className="card">
          <h3 className="font-semibold mb-3">Budget</h3>
          <div className="text-2xl font-bold text-sage-600">
            ${gameState.budget}
          </div>
          <div className="text-sm text-stone-600 mt-1">
            Remaining budget for this level
          </div>
        </div>
      )}

      {/* Level Info */}
      {currentLevel && (
        <div className="card">
          <h3 className="font-semibold mb-3">Current Level</h3>
          <h4 className="font-medium text-lg mb-2">{currentLevel.name}</h4>
          <p className="text-sm text-stone-600 mb-3">{currentLevel.description}</p>
          
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
        </div>
      )}

      {/* Next Level */}
      {gameState.currentLevel < levels.length - 1 && (
        <button 
          onClick={onNextLevel}
          className="w-full btn-primary"
        >
          Next Level
        </button>
      )}

      {/* Instructions */}
      <div className="card">
        <h3 className="font-semibold mb-3">How to Play</h3>
        <div className="text-sm text-stone-600 space-y-2">
          <p>• Click to place nodes</p>
          <p>• Click two nodes to connect with beams</p>
          <p>• Select materials from the panel</p>
          <p>• Test your bridge with vehicles</p>
          <p>• Balance cost, strength, and stability</p>
        </div>
      </div>
    </div>
  )
}

export default GameUI
