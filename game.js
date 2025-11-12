// Bridgecraft Game Implementation
class BridgecraftGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.nodes = [];
        this.beams = [];
        this.selectedNode = null;
        this.selectedMaterial = 'wood';
        this.budget = 500;
        this.isSimulating = false;
        this.showStressMap = false;
        this.vehicles = [];
        
        this.materials = {
            wood: { color: '#8B4513', cost: 10, strength: 40, elasticity: 0.3 },
            steel: { color: '#71717A', cost: 50, strength: 250, elasticity: 0.1 },
            cable: { color: '#4A5568', cost: 30, strength: 200, elasticity: 0.05 }
        };
        
        this.level = {
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
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeLevel();
        this.startRenderLoop();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    initializeLevel() {
        this.nodes = [...this.level.nodes];
        this.beams = [];
        this.vehicles = [];
        this.budget = this.level.budget;
        this.isSimulating = false;
        
        // Create physics bodies for fixed nodes
        this.nodes.forEach(node => {
            if (node.isFixed) {
                node.body = Matter.Bodies.circle(node.x, node.y, 8, {
                    isStatic: true,
                    render: { fillStyle: node.isAnchor ? '#EF4444' : '#6B7280' }
                });
                Matter.World.add(this.world, node.body);
            }
        });
        
        this.updateUI();
    }
    
    handleCanvasClick(e) {
        if (this.isSimulating) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedNode = this.findNearestNode(x, y);
        
        if (clickedNode) {
            if (this.selectedNode && this.selectedNode !== clickedNode.id) {
                this.createBeam(this.selectedNode, clickedNode.id);
                this.selectedNode = null;
            } else {
                this.selectedNode = clickedNode.id;
            }
        } else {
            this.createNode(x, y);
        }
    }
    
    findNearestNode(x, y, threshold = 20) {
        let nearestNode = null;
        let minDistance = threshold;
        
        this.nodes.forEach(node => {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        });
        
        return nearestNode;
    }
    
    createNode(x, y) {
        const newNode = {
            id: `node-${Date.now()}`,
            x,
            y,
            isFixed: false
        };
        
        newNode.body = Matter.Bodies.circle(x, y, 6, {
            render: { fillStyle: '#9CA3AF' }
        });
        
        Matter.World.add(this.world, newNode.body);
        this.nodes.push(newNode);
        this.selectedNode = newNode.id;
    }
    
    createBeam(startNodeId, endNodeId) {
        const startNode = this.nodes.find(n => n.id === startNodeId);
        const endNode = this.nodes.find(n => n.id === endNodeId);
        
        if (!startNode || !endNode) return;
        
        const length = Math.sqrt((startNode.x - endNode.x) ** 2 + (startNode.y - endNode.y) ** 2);
        const cost = Math.ceil(length * this.materials[this.selectedMaterial].cost / 100);
        
        if (cost > this.budget) {
            this.showMessage("Not enough budget!");
            return;
        }
        
        const beamId = `beam-${Date.now()}`;
        const material = this.materials[this.selectedMaterial];
        
        const beam = {
            id: beamId,
            startNodeId,
            endNodeId,
            material: this.selectedMaterial,
            stress: 0,
            maxStress: material.strength,
            cost,
            constraint: null
        };
        
        // Create constraint
        const constraint = Matter.Constraint.create({
            bodyA: startNode.body,
            bodyB: endNode.body,
            stiffness: 1 - material.elasticity,
            render: {
                strokeStyle: material.color,
                lineWidth: this.selectedMaterial === 'cable' ? 2 : 4
            }
        });
        
        beam.constraint = constraint;
        Matter.World.add(this.world, constraint);
        
        this.beams.push(beam);
        this.budget -= cost;
        this.updateUI();
    }
    
    startSimulation() {
        if (this.isSimulating) return;
        
        this.isSimulating = true;
        this.engine.enabled = true;
        
        // Add vehicles
        this.level.vehicles.forEach(vehicle => {
            const vehicleBody = Matter.Bodies.rectangle(vehicle.x, vehicle.y, 40, 20, {
                mass: vehicle.weight,
                render: { fillStyle: '#DC2626' }
            });
            
            // Apply initial velocity
            Matter.Body.setVelocity(vehicleBody, { x: vehicle.velocity, y: 0 });
            
            Matter.World.add(this.world, vehicleBody);
            this.vehicles.push(vehicleBody);
        });
        
        this.updateUI();
    }
    
    resetGame() {
        Matter.World.clear(this.world);
        Matter.Engine.clear(this.engine);
        this.initializeLevel();
    }
    
    toggleStressMap() {
        this.showStressMap = !this.showStressMap;
        const legend = document.getElementById('stress-legend');
        const button = document.querySelector('button[onclick="toggleStressMap()"]');
        
        if (this.showStressMap) {
            legend.style.display = 'block';
            button.textContent = 'Hide Stress';
        } else {
            legend.style.display = 'none';
            button.textContent = 'Show Stress';
        }
    }
    
    selectMaterial(material) {
        this.selectedMaterial = material;
        
        // Update UI
        document.querySelectorAll('.material-button').forEach(btn => {
            btn.classList.remove('border-green-600', 'bg-green-50');
            btn.classList.add('border-stone-200');
        });
        
        const selectedBtn = document.querySelector(`button[onclick="selectMaterial('${material}')"]`);
        selectedBtn.classList.remove('border-stone-200');
        selectedBtn.classList.add('border-green-600', 'bg-green-50');
    }
    
    updateUI() {
        document.getElementById('budget-display').textContent = this.budget;
        document.getElementById('beam-count').textContent = this.beams.length;
        
        const testButton = document.getElementById('test-button');
        if (this.isSimulating) {
            testButton.textContent = 'Simulating...';
            testButton.disabled = true;
        } else {
            testButton.textContent = 'Test Bridge';
            testButton.disabled = false;
        }
    }
    
    showMessage(message) {
        // Simple message display - could be enhanced with a proper UI
        alert(message);
    }
    
    startRenderLoop() {
        const render = () => {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw river
            this.drawRiver();
            
            // Draw nodes
            this.nodes.forEach(node => this.drawNode(node));
            
            // Draw beams
            this.beams.forEach(beam => this.drawBeam(beam));
            
            // Draw vehicles
            this.vehicles.forEach(vehicle => this.drawVehicle(vehicle));
            
            // Highlight selected node
            if (this.selectedNode) {
                const node = this.nodes.find(n => n.id === this.selectedNode);
                if (node) {
                    this.ctx.strokeStyle = '#10B981';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
            
            // Update physics
            if (this.isSimulating) {
                Matter.Engine.update(this.engine);
                this.updateBeamStresses();
            }
            
            requestAnimationFrame(render);
        };
        
        render();
    }
    
    drawRiver() {
        this.ctx.fillStyle = '#3B82F6';
        this.ctx.fillRect(150, 420, 200, 50);
        
        // Add some wave effect
        this.ctx.strokeStyle = '#1E40AF';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 200; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(150 + i, 420);
            this.ctx.quadraticCurveTo(150 + i + 10, 415, 150 + i + 20, 420);
            this.ctx.stroke();
        }
    }
    
    drawNode(node) {
        const color = node.isAnchor ? '#EF4444' : (node.isFixed ? '#6B7280' : '#9CA3AF');
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.isAnchor ? 8 : 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (node.isAnchor) {
            this.ctx.strokeStyle = '#DC2626';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    drawBeam(beam) {
        const startNode = this.nodes.find(n => n.id === beam.startNodeId);
        const endNode = this.nodes.find(n => n.id === beam.endNodeId);
        
        if (!startNode || !endNode) return;
        
        const material = this.materials[beam.material];
        
        // Determine color based on stress
        let color = material.color;
        if (this.showStressMap && beam.stress > 0) {
            const stressRatio = beam.stress / beam.maxStress;
            if (stressRatio > 0.8) {
                color = '#DC2626'; // Critical stress
            } else if (stressRatio > 0.5) {
                color = '#F59E0B'; // Medium stress
            } else {
                color = '#3B82F6'; // Low stress
            }
        }
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = beam.material === 'cable' ? 2 : 4;
        this.ctx.beginPath();
        this.ctx.moveTo(startNode.x, startNode.y);
        this.ctx.lineTo(endNode.x, endNode.y);
        this.ctx.stroke();
    }
    
    drawVehicle(vehicle) {
        this.ctx.fillStyle = '#DC2626';
        this.ctx.fillRect(
            vehicle.position.x - 20, 
            vehicle.position.y - 10, 
            40, 
            20
        );
    }
    
    updateBeamStresses() {
        this.beams.forEach(beam => {
            const startNode = this.nodes.find(n => n.id === beam.startNodeId);
            const endNode = this.nodes.find(n => n.id === beam.endNodeId);
            
            if (!startNode || !endNode || !startNode.body || !endNode.body) return;
            
            // Calculate stress based on distance from rest length
            const currentDistance = Math.sqrt(
                (startNode.body.position.x - endNode.body.position.x) ** 2 +
                (startNode.body.position.y - endNode.body.position.y) ** 2
            );
            
            const restLength = 100; // Default rest length
            const displacement = Math.abs(currentDistance - restLength);
            beam.stress = displacement * 10; // Simplified stress calculation
        });
    }
}

// Tutorial system
let tutorialStep = 0;
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
];

function nextTutorialStep() {
    tutorialStep++;
    
    if (tutorialStep >= tutorialSteps.length) {
        closeTutorial();
        return;
    }
    
    const step = tutorialSteps[tutorialStep];
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-content').textContent = step.content;
    
    // Update progress indicators
    const indicators = document.querySelectorAll('#tutorial-overlay .w-2, #tutorial-overlay .w-8');
    indicators.forEach((indicator, index) => {
        if (index === tutorialStep) {
            indicator.className = 'w-8 h-2 rounded-full bg-white';
        } else {
            indicator.className = 'w-2 h-2 rounded-full bg-white/50';
        }
    });
}

function skipTutorial() {
    closeTutorial();
}

function closeTutorial() {
    document.getElementById('tutorial-overlay').style.display = 'none';
}

// Global game instance
let game;

// Global functions for HTML onclick handlers
function startSimulation() {
    game.startSimulation();
}

function resetGame() {
    game.resetGame();
}

function toggleStressMap() {
    game.toggleStressMap();
}

function selectMaterial(material) {
    game.selectMaterial(material);
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new BridgecraftGame();
});