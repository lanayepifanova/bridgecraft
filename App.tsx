import React, { useState, useEffect } from 'react'
import GameCanvas from './components/GameCanvas'
import GameUI from './components/GameUI'
import TutorialOverlay from './components/TutorialOverlay'
import AudioManager from './utils/AudioManager'
import { GameState, Level, MaterialType } from './types/game'
import { initializeLevels } from './utils/levelManager'

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 0,
    isPlaying: false,
    isPaused: false,
    showTutorial: true,
    selectedMaterial: MaterialType.WOOD,
    budget: 1000,
    score: 0,
    zenMode: false
  })

  const [levels, setLevels] = useState<Level[]>([])
  const [audioManager] = useState(() => new AudioManager())

  useEffect(() => {
    const initialLevels = initializeLevels()
    setLevels(initialLevels)
    audioManager.init()
    
    return () => {
      audioManager.cleanup()
    }
  }, [])

  const handleStartGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, showTutorial: false }))
    audioManager.playAmbientSound()
  }

  const handleTogglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleSelectMaterial = (material: MaterialType) => {
    setGameState(prev => ({ ...prev, selectedMaterial: material }))
  }

  const handleToggleZenMode = () => {
    setGameState(prev => ({ 
      ...prev, 
      zenMode: !prev.zenMode,
      budget: prev.zenMode ? 1000 : Infinity 
    }))
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

  const handleCloseTutorial = () => {
    setGameState(prev => ({ ...prev, showTutorial: false }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {gameState.showTutorial && (
        <TutorialOverlay onClose={handleCloseTutorial} onStartGame={handleStartGame} />
      )}
      
      <div className="flex h-screen">
        <div className="flex-1 relative">
          <GameCanvas 
            gameState={gameState}
            levels={levels}
            audioManager={audioManager}
          />
        </div>
        
        <div className="w-80 bg-white border-l border-stone-200 p-6 overflow-y-auto">
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