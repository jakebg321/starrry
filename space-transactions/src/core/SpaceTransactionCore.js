// src/core/SpaceTransactionCore.js
import { EventEmitter } from 'events'
import * as THREE from 'three'
import PhysicsManager from '../managers/PhysicsManager'
import SpatialManager from '../managers/SpatialManager'
import OrbitManager from '../managers/OrbitManager'
import EntityManager from '../managers/EntityManager'

class SpaceTransactionCore extends EventEmitter {
  constructor(options = {}) {
    super()
    this.options = {
      maxEntities: options.maxEntities || 1000,
      updateFrequency: options.updateFrequency || 60,
      minTransactionValue: options.minTransactionValue || 1,
      galaxyScale: options.galaxyScale || 100,
      ...options
    }
    
    this.galaxyRadius = this.options.galaxyScale
    this.totalMass = 0

    // Add constants at class level
    this.CAPTURE_RADIUS_MULTIPLIER = 10
    this.CAPTURE_CHANCE_MIN = 0.01  // 1%
    this.CAPTURE_CHANCE_MAX = 0.05  // 5%

    // Initialize managers
    this.physicsManager = new PhysicsManager(options)
    this.spatialManager = new SpatialManager({
      x: -this.galaxyRadius,
      y: -this.galaxyRadius,
      width: this.galaxyRadius * 2,
      height: this.galaxyRadius * 2
    })
    this.orbitManager = new OrbitManager(options)
    this.entityManager = new EntityManager(options)

    this.lastUpdate = Date.now()
    this.isActive = false
  }

  processTransaction(transaction) {
    if (transaction.amount < this.options.minTransactionValue) {
      return null
    }

    // Calculate orbital parameters
    const orbit = this.physicsManager.calculateKeplerianOrbit(transaction.amount)
    const armIndex = Math.floor(Math.random() * this.options.galaxyArms)
    const initialAngle = Math.random() * Math.PI * 2

    // Create entity
    const entity = this.entityManager.createEntity({
      orbit,
      armIndex,
      angle: initialAngle,
      scale: this.calculateEntityScale(transaction.amount),
      type: this.determineEntityType(transaction),
      data: transaction
    })

    // Calculate initial position
    entity.position = this.orbitManager.calculateSpiralPosition(
      orbit,
      initialAngle,
      armIndex
    )

    // Update spatial index
    this.spatialManager.insert(entity)
    
    // Update galaxy properties
    this.totalMass += transaction.amount
    this.updateGalaxyRadius()

    this.emit('entityCreated', entity)
    return entity
  }

  determineEntityType(transaction) {
    const amount = transaction.amount
    if (amount > 5000) return 'major'
    if (amount > 1000) return 'ringed-planet'
    if (amount > 500) return 'planet'
    if (amount > 300) return 'star'
    return 'small-planet'  // New type for smallest transactions
  }
  
  calculateEntityScale(amount) {
    // Define our thresholds and their corresponding base scales
    if (amount > 5000) {
      // Massive entities (major)
      return 3 + Math.min(2, Math.log10(amount/5000))
    } else if (amount > 1000) {
      // Stars (1000-5000)
      return 2 + ((amount - 1000) / 4000)
    } else if (amount > 500) {
      // Ringed planets (500-1000)
      return 1.5 + ((amount - 500) / 1000)
    } else if (amount > 300) {
      // Regular planets (300-500)
      return 1 + ((amount - 300) / 400)
    } else {
      // Small planets (<300)
      return 0.5 + (amount / 600)
    }
  }

  updateGalaxyRadius() {
    const newRadius = Math.min(
      1000,
      this.options.galaxyScale * Math.log10(this.totalMass / 1000)
    )
    if (Math.abs(this.galaxyRadius - newRadius) > 1) {
      this.galaxyRadius = newRadius
      this.emit('galaxyScaled', this.galaxyRadius)
    }
  }

  calculateCaptureRadius(entity) {
    if (entity.type === 'major') {
      return entity.scale * this.CAPTURE_RADIUS_MULTIPLIER
    }
    return 0
  }

  checkForCapture(entity, majorEntity) {
    const captureRadius = this.calculateCaptureRadius(majorEntity)
    const distance = entity.position.distanceTo(majorEntity.position)
    
    console.log('---CAPTURE CHECK---')
    console.log(`Distance: ${distance.toFixed(4)} vs Radius: ${captureRadius.toFixed(4)}`)
    
    if (distance <= captureRadius) {
      const captureChance = this.CAPTURE_CHANCE_MIN + 
        Math.random() * (this.CAPTURE_CHANCE_MAX - this.CAPTURE_CHANCE_MIN)
      const roll = Math.random()
      
      console.log(`Capture roll: ${roll.toFixed(4)} vs Chance: ${captureChance.toFixed(4)}`)
      
      return roll <= captureChance
    }
    return false
  }

  generateCapturedOrbit(entity, parent) {
    return this.physicsManager.calculateCapturedOrbit(entity.data.amount, parent.scale)
  }

  update(deltaTime) {
    if (!this.isActive) return
    
    this.spatialManager.clear()
    
    // Process major entities first
    const entities = this.entityManager.getEntities()
    const majorEntities = entities.filter(e => e.type === 'major')
    
    // Check for captures
    entities.forEach(entity => {
      if (entity.type !== 'major' && !entity.parentId) {
        for (const majorEntity of majorEntities) {
          if (this.checkForCapture(entity, majorEntity)) {
            const success = this.entityManager.setEntityParent(entity.id, majorEntity.id)
            if (success) {
              entity.orbit = this.generateCapturedOrbit(entity, majorEntity)
              entity.angle = Math.random() * Math.PI * 2
              console.log('---CAPTURE COMPLETE---')
              console.log(`Entity ${entity.id} now orbiting ${majorEntity.id}`)
            }
          }
        }
      }
    })

    // Update positions
    entities.forEach(entity => {
      if (entity.parentId) {
        const parent = this.entityManager.getEntity(entity.parentId)
        if (parent) {
          // Update angle for captured entities
          const orbitalPeriod = entity.orbit.period
          const angleChange = (deltaTime / orbitalPeriod) * 2 * Math.PI
          entity.angle = (entity.angle + angleChange) % (2 * Math.PI)
          
          // Calculate new position relative to parent
          const relativePos = this.orbitManager.calculateSpiralPosition(
            entity.orbit,
            entity.angle,
            0  // No arm index for captured entities
          )
          entity.position.copy(relativePos).add(parent.position)
        }
      } else {
        // Make sure major bodies and stars get updated
        this.orbitManager.updateEntityPosition(entity, deltaTime)
      }
      this.spatialManager.insert(entity)
    })

    this.emit('updated', deltaTime)
  }

  queryView(camera, viewDistance = 100) {
    return this.spatialManager.query(camera, viewDistance)
  }

  start() {
    this.isActive = true
    this.emit('started')
  }

  stop() {
    this.isActive = false
    this.emit('stopped')
  }
}

export default SpaceTransactionCore