import Matter from 'matter-js'
import { Node, Beam, MaterialType, PhysicsState } from '../types/game'
import { MATERIALS } from './materials'

export class PhysicsEngine {
  private engine: Matter.Engine
  private world: Matter.World
  private render: Matter.Render
  private nodes: Map<string, Matter.Body>
  private beams: Map<string, Matter.Constraint>

  constructor(canvas: HTMLCanvasElement) {
    this.engine = Matter.Engine.create()
    this.world = this.engine.world
    this.engine.world.gravity.y = 1
    
    this.render = Matter.Render.create({
      canvas: canvas,
      engine: this.engine,
      options: {
        width: canvas.width,
        height: canvas.height,
        wireframes: false,
        background: 'transparent',
        showAngleIndicator: false,
        showVelocity: false
      }
    })

    this.nodes = new Map()
    this.beams = new Map()
  }

  initialize(nodes: Node[]): void {
    // Create static anchor nodes
    nodes.forEach(node => {
      if (node.isAnchor || node.isFixed) {
        const body = Matter.Bodies.circle(node.x, node.y, 8, {
          isStatic: true,
          render: {
            fillStyle: node.isAnchor ? '#EF4444' : '#6B7280'
          }
        })
        Matter.World.add(this.world, body)
        this.nodes.set(node.id, body)
      }
    })

    Matter.Render.run(this.render)
  }

  addBeam(beam: Beam, startNode: Node, endNode: Node): void {
    const startBody = this.nodes.get(beam.startNodeId)
    const endBody = this.nodes.get(beam.endNodeId)
    
    if (!startBody || !endBody) {
      // Create bodies for non-anchor nodes
      const newStartBody = Matter.Bodies.circle(startNode.x, startNode.y, 6, {
        render: {
          fillStyle: '#9CA3AF'
        }
      })
      
      const newEndBody = Matter.Bodies.circle(endNode.x, endNode.y, 6, {
        render: {
          fillStyle: '#9CA3AF'
        }
      })

      Matter.World.add(this.world, [newStartBody, newEndBody])
      this.nodes.set(startNode.id, newStartBody)
      this.nodes.set(endNode.id, newEndBody)
    }

    const material = MATERIALS[beam.material]
    const constraint = Matter.Constraint.create({
      bodyA: this.nodes.get(beam.startNodeId)!,
      bodyB: this.nodes.get(beam.endNodeId)!,
      stiffness: 1 - material.elasticity,
      render: {
        type: 'line',
        strokeStyle: material.color,
        lineWidth: beam.material === MaterialType.CABLE ? 2 : 4
      }
    })

    Matter.World.add(this.world, constraint)
    this.beams.set(beam.id, constraint)
  }

  removeBeam(beamId: string): void {
    const constraint = this.beams.get(beamId)
    if (constraint) {
      Matter.World.remove(this.world, constraint)
      this.beams.delete(beamId)
    }
  }

  addVehicle(x: number, y: number, weight: number): Matter.Body {
    const vehicle = Matter.Bodies.rectangle(x, y, 40, 20, {
      mass: weight,
      render: {
        fillStyle: '#DC2626'
      }
    })

    Matter.World.add(this.world, vehicle)
    return vehicle
  }

  startSimulation(): void {
    Matter.Engine.run(this.engine)
  }

  pauseSimulation(): void {
    this.engine.enabled = false
  }

  resumeSimulation(): void {
    this.engine.enabled = true
  }

  reset(): void {
    Matter.World.clear(this.world, false)
    Matter.Engine.clear(this.engine)
    this.nodes.clear()
    this.beams.clear()
  }

  calculateStress(beamId: string): number {
    const constraint = this.beams.get(beamId)
    if (!constraint) return 0

    const bodyA = constraint.bodyA
    const bodyB = constraint.bodyB
    if (!bodyA || !bodyB) return 0
    
    // Calculate distance between nodes
    const dx = bodyB.position.x - bodyA.position.x
    const dy = bodyB.position.y - bodyA.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Calculate force based on displacement from rest length
    const restLength = constraint.length || 100
    const displacement = Math.abs(distance - restLength)
    const force = displacement * (1 - constraint.stiffness) * 100
    
    return Math.max(0, force)
  }

  getPhysicsState(): PhysicsState {
    return {
      world: this.world,
      engine: this.engine,
      render: this.render,
      nodes: this.nodes,
      beams: this.beams
    }
  }
}
