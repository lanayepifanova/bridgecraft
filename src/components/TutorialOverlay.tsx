import { useState } from 'react'

interface TutorialOverlayProps {
  onClose: () => void
  onStartGame: () => void
}

const TutorialOverlay = ({ onClose, onStartGame }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const tutorialSteps = [
    {
      title: "Welcome to Bridgecraft",
      content: "A physics-based bridge building simulator where engineering meets artistry.",
      image: "bridge-hero"
    },
    {
      title: "The Challenge",
      content: "Build bridges that can support vehicles while staying within budget. Each material has different properties and costs.",
      image: "materials-demo"
    },
    {
      title: "Building Basics",
      content: "Click to place nodes, then connect them with beams. Choose materials wisely - wood is cheap but weak, steel is strong but expensive.",
      image: "building-demo"
    },
    {
      title: "Physics & Stress",
      content: "Watch for stress indicators. Red means high tension, blue means stable. Use cables for tension, steel for compression.",
      image: "stress-demo"
    },
    {
      title: "Testing & Iteration",
      content: "Test your bridge with vehicles. If it collapses, analyze the failure and try again. Engineering is iterative!",
      image: "testing-demo"
    }
  ]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onStartGame()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onStartGame()
  }

  const handleClose = () => {
    onClose()
  }

  const currentStepData = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          aria-label="Close tutorial"
        >
          ×
        </button>
        {/* Header */}
        <div className="bg-gradient-to-r from-sage-600 to-sage-700 text-white p-6">
          <h2 className="text-2xl font-space font-bold mb-2">{currentStepData.title}</h2>
          <div className="flex items-center space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'w-8 bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-stone-100 rounded-xl h-48 flex items-center justify-center mb-4">
              <div className="text-center text-stone-500">
                <div className="text-4xl mb-2">🏗️</div>
                <p className="text-sm">{currentStepData.image}</p>
              </div>
            </div>
            
            <p className="text-stone-700 text-lg leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-stone-500 hover:text-stone-700 transition-colors"
            >
              Skip Tutorial
            </button>
            
            <div className="flex items-center space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="btn-secondary"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Start Building' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialOverlay
