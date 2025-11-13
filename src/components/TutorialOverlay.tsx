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
      visual: "bridge-hero"
    },
    {
      title: "The Challenge",
      content: "Build bridges that can support vehicles while staying within budget. Each material has different properties and costs.",
      visual: "materials-demo"
    },
    {
      title: "Building Basics",
      content: "Click to place nodes, then connect them with beams. Choose materials wisely - wood is cheap but weak, steel is strong but expensive.",
      visual: "building-demo"
    },
    {
      title: "Physics & Stress",
      content: "Watch for stress indicators. Red means high tension, blue means stable. Use cables for tension, steel for compression.",
      visual: "stress-demo"
    },
    {
      title: "Testing & Iteration",
      content: "Test your bridge with vehicles. If it collapses, analyze the failure and try again. Engineering is iterative!",
      visual: "testing-demo"
    }
  ]

  const renderVisual = (key: string) => {
    switch (key) {
      case 'materials-demo':
        return (
          <svg viewBox="0 0 320 180" className="w-full h-full">
            <rect width="320" height="180" rx="16" fill="#f5f5f4" />
            <rect x="30" y="50" width="80" height="80" rx="10" fill="#8B4513" opacity="0.9" />
            <rect x="130" y="40" width="80" height="100" rx="10" fill="#71717A" opacity="0.9" />
            <rect x="230" y="60" width="60" height="60" rx="10" fill="#4A5568" opacity="0.9" />
            <text x="70" y="135" textAnchor="middle" fill="#4b5563" fontSize="12">Wood</text>
            <text x="170" y="135" textAnchor="middle" fill="#4b5563" fontSize="12">Steel</text>
            <text x="260" y="135" textAnchor="middle" fill="#4b5563" fontSize="12">Cable</text>
          </svg>
        )
      case 'building-demo':
        return (
          <svg viewBox="0 0 320 180" className="w-full h-full">
            <rect width="320" height="180" rx="16" fill="#eef2ff" />
            <circle cx="50" cy="120" r="8" fill="#ef4444" />
            <circle cx="150" cy="80" r="8" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
            <circle cx="260" cy="120" r="8" fill="#ef4444" />
            <line x1="50" y1="120" x2="150" y2="80" stroke="#94a3b8" strokeWidth="4" strokeDasharray="6 6" />
            <line x1="150" y1="80" x2="260" y2="120" stroke="#94a3b8" strokeWidth="4" strokeDasharray="6 6" />
          </svg>
        )
      case 'stress-demo':
        return (
          <svg viewBox="0 0 320 180" className="w-full h-full">
            <rect width="320" height="180" rx="16" fill="#fef2f2" />
            <line x1="40" y1="120" x2="280" y2="120" stroke="#bfdbfe" strokeWidth="6" />
            <line x1="40" y1="120" x2="160" y2="60" stroke="url(#stressGrad)" strokeWidth="6" />
            <line x1="160" y1="60" x2="280" y2="120" stroke="url(#stressGrad)" strokeWidth="6" />
            <defs>
              <linearGradient id="stressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
        )
      case 'testing-demo':
        return (
          <svg viewBox="0 0 320 180" className="w-full h-full">
            <rect width="320" height="180" rx="16" fill="#ecfccb" />
            <rect x="40" y="110" width="240" height="14" rx="7" fill="#94a3b8" />
            <rect x="120" y="80" width="80" height="40" rx="6" fill="#ef4444" />
            <circle cx="140" cy="125" r="10" fill="#1f2937" />
            <circle cx="180" cy="125" r="10" fill="#1f2937" />
            <text x="160" y="70" textAnchor="middle" fill="#1f2937" fontSize="12">Test Run</text>
          </svg>
        )
      case 'bridge-hero':
      default:
        return (
          <svg viewBox="0 0 320 180" className="w-full h-full">
            <rect width="320" height="180" rx="16" fill="#e0f2fe" />
            <rect y="120" width="320" height="60" fill="#cbd5f5" />
            <circle cx="80" cy="140" r="40" fill="#facc15" opacity="0.2" />
            <line x1="50" y1="130" x2="160" y2="70" stroke="#94a3b8" strokeWidth="6" />
            <line x1="160" y1="70" x2="270" y2="130" stroke="#94a3b8" strokeWidth="6" />
            <line x1="50" y1="130" x2="270" y2="130" stroke="#475569" strokeWidth="8" />
          </svg>
        )
    }
  }

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
            <div className="bg-white rounded-xl h-48 flex items-center justify-center mb-4 shadow-inner">
              {renderVisual(currentStepData.visual)}
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
