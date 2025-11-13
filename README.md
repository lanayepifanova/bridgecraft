# Bridgecraft

A minimalist physics-based bridge-building simulator where players design and test bridges using realistic engineering mechanics.

## Features

- **Physics-Based Simulation**: Realistic bridge mechanics using Matter.js
- **Material System**: Wood, Steel, and Cable materials with distinct properties
- **Stress Analysis**: Visual stress indicators showing tension and compression
- **Level Progression**: 5 increasingly challenging levels
- **Zen Mode**: Unlimited building without budget constraints
- **Educational**: Learn about structural engineering principles

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Physics**: Matter.js for realistic bridge simulation
- **Styling**: TailwindCSS with custom design system
- **Build**: Vite for fast development and optimized builds

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bridgecraft
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Gameplay

### Objective
Build bridges that can support vehicles crossing from one side to another while staying within budget and optimizing for structural efficiency.

### Controls
- **Click**: Place nodes or select existing nodes
- **Click two nodes**: Connect them with a beam using the selected material
- **Material Selection**: Choose from Wood, Steel, or Cable in the UI panel
- **Test Bridge**: Click "Test Bridge" to simulate vehicles crossing

### Materials

- **Wood**: Cheap ($10/unit), moderate strength, good for light loads
- **Steel**: Expensive ($50/unit), high strength, ideal for heavy loads
- **Cable**: Moderate cost ($30/unit), excellent for tension, poor for compression

### Stress Indicators

- **Blue**: Low stress, stable structure
- **Amber**: Medium stress, monitor closely
- **Red**: High stress, risk of failure

## Level Design

The game features 5 progressively challenging levels:

1. **First Span**: Simple gap crossing introduction
2. **Double Span**: Multiple support requirements
3. **Valley Crossing**: Wind forces introduced
4. **Mountain Pass**: Complex terrain and heavy loads
5. **Grand Canyon**: Ultimate engineering challenge

## Development

### Project Structure

```
src/
├── components/     # React components
├── utils/         # Game logic and utilities  
├── types/         # TypeScript type definitions
└── App.tsx        # Main application component
```

### Key Components

- **GameCanvas**: Main game rendering and interaction
- **PhysicsEngine**: Matter.js integration and bridge simulation
- **GameUI**: User interface and controls
- **TutorialOverlay**: Interactive tutorial system

### Adding New Levels

Edit `src/utils/levelManager.ts` to add new level configurations:

```typescript
{
  id: 6,
  name: "New Level",
  description: "Level description",
  budget: 1500,
  nodes: [/* anchor and support nodes */],
  vehicles: [/* vehicle configurations */],
  windForce?: 0.02, // optional wind
  river?: { width: 300, depth: 100 } // optional river
}
```

## Design Philosophy

Bridgecraft follows a minimalist design approach inspired by Monument Valley and Poly Bridge:

- **Clean Typography**: Inter and Space Grotesk fonts
- **Neutral Color Palette**: Soft stone and sage tones
- **Intentional UI**: Every element serves a purpose
- **Calm Aesthetics**: Reducing cognitive load while maintaining depth

## Educational Value

The game teaches fundamental engineering concepts:

- **Material Properties**: Tension, compression, elasticity
- **Structural Analysis**: Stress distribution and failure modes
- **Cost Optimization**: Balancing performance with budget
- **Iterative Design**: Learning from failures and improvements

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License.
