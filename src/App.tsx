import { useState, useEffect } from 'react'
import GameCanvas from './components/GameCanvas'
import GameUI from './components/GameUI'
import TutorialOverlay from './components/TutorialOverlay'
import { GameState, Level, MaterialType } from './types/game'
import { initializeLevels } from './utils/levelManager'

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 0,
    isPaused: false,
    showTutorial: true,
    selectedMaterial: MaterialType.WOOD,
    budget: 1000,
    score: 0,
    zenMode: false
  })

  const [levels, setLevels] = useState<Level[]>([])

  useEffect(() => {
    const initialLevels = initializeLevels()
    setLevels(initialLevels)
    
    if (initialLevels.length > 0) {
      setGameState(prev => ({
        ...prev,
        budget: prev.zenMode ? prev.budget : initialLevels[0].budget
      }))
    }
  }, [])

  const handleStartGame = () => {
    setGameState(prev => ({ ...prev, showTutorial: false }))
  }

  const handleTogglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleSelectMaterial = (material: MaterialType) => {
    setGameState(prev => ({ ...prev, selectedMaterial: material }))
  }

  const handleToggleZenMode = () => {
    setGameState(prev => {
      const currentLevelBudget = levels[prev.currentLevel]?.budget ?? prev.budget
      const isExitingZen = prev.zenMode
      
      return { 
        ...prev, 
        zenMode: !prev.zenMode,
        budget: isExitingZen ? currentLevelBudget : Infinity 
      }
    })
  }

  const handleNextLevel = () => {
    if (gameState.currentLevel < levels.length - 1) {
      setGameState(prev => ({ 
        ...prev, 
        currentLevel: prev.currentLevel + 1,
        budget: levels[prev.currentLevel + 1].budget
      }))
    }
  }

  const handleSpendBudget = (cost: number) => {
    setGameState(prev => {
      if (prev.zenMode) return prev
      return {
        ...prev,
        budget: Math.max(0, prev.budget - cost)
      }
    })
  }

  const handleResetBudget = () => {
    setGameState(prev => {
      if (prev.zenMode) return prev
      const currentLevelBudget = levels[prev.currentLevel]?.budget
      if (typeof currentLevelBudget !== 'number') return prev
      return {
        ...prev,
        budget: currentLevelBudget
      }
    })
  }

  const handleRefundBudget = (amount: number) => {
    setGameState(prev => {
      if (prev.zenMode) return prev
      const currentLevelBudget = levels[prev.currentLevel]?.budget
      if (typeof currentLevelBudget !== 'number') {
        return {
          ...prev,
          budget: prev.budget + amount
        }
      }

      return {
        ...prev,
        budget: Math.min(currentLevelBudget, prev.budget + amount)
      }
    })
  }

  const handleRestoreBudget = (amount: number) => {
    setGameState(prev => {
      if (prev.zenMode) return prev
      const currentLevelBudget = levels[prev.currentLevel]?.budget
      if (typeof currentLevelBudget !== 'number') return prev
      return {
        ...prev,
        budget: Math.min(currentLevelBudget, amount)
      }
    })
  }

  const handleCloseTutorial = () => {
    setGameState(prev => ({ ...prev, showTutorial: false }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {gameState.showTutorial && (
        <TutorialOverlay onClose={handleCloseTutorial} onStartGame={handleStartGame} />
      )}
      
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="order-2 lg:order-1 flex-1 relative h-[60vh] lg:h-auto">
          <GameCanvas 
            gameState={gameState}
            levels={levels}
            onSpendBudget={handleSpendBudget}
            onResetBudget={handleResetBudget}
            onRefundBudget={handleRefundBudget}
            onRestoreBudget={handleRestoreBudget}
          />
        </div>
        
        <div className="order-1 lg:order-2 w-full lg:w-80 xl:w-96 2xl:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-stone-200 p-4 lg:p-6 overflow-y-auto">
          <GameUI 
            gameState={gameState}
            levels={levels}
            onTogglePause={handleTogglePause}
            onSelectMaterial={handleSelectMaterial}
            onToggleZenMode={handleToggleZenMode}
            onNextLevel={handleNextLevel}
          />
        </div>
      </div>
    </div>
  )
}

export default App
