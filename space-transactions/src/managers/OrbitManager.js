// src/managers/OrbitManager.js
import * as THREE from 'three'

class OrbitManager {
    constructor(options = {}) {
      this.options = {
        galaxyArms: options.galaxyArms || 4,
        galaxyPitch: options.galaxyPitch || 0.2,
        spiralTightness: options.spiralTightness || 0.1,
        verticalScale: options.verticalScale || 0.1,
        rotationSpeed: options.rotationSpeed || 0.5,
        ...options
      }
    }
  
    calculateSpiralPosition(orbit, angle, armIndex) {
      // Calculate arm offset
      const armOffset = (2 * Math.PI * armIndex) / this.options.galaxyArms
      
      // Calculate base orbital position
      const orbitAngle = angle + armOffset
      const r = orbit.radius
      
      // Calculate position with orbital motion
      const position = new THREE.Vector3(
        r * Math.cos(orbitAngle),
        0,
        r * Math.sin(orbitAngle)
      )
  
      // Apply spiral effect
      const spiralFactor = Math.exp(this.options.spiralTightness * orbitAngle)
      position.multiplyScalar(spiralFactor)
      
      // Add slight vertical displacement based on radius
      position.y = Math.sin(orbitAngle * 2) * this.options.verticalScale * orbit.radius
      
      // Apply orbital tilt
      position.applyEuler(orbit.inclination)
      
      return position
    }
  
    updateEntityPosition(entity, deltaTime) {
      const { orbit, armIndex, type } = entity

      // Verify we have valid orbital parameters
      if (!orbit || !orbit.radius) {
        console.warn('Missing orbital parameters for entity:', entity.id)
        return entity
      }
      
      // Different orbital periods based on entity type
      let orbitalPeriod
      if (type === 'major') {
        // Slower period for major bodies
        orbitalPeriod = 2 * Math.PI * Math.sqrt(orbit.radius / (this.options.rotationSpeed * 0.2))
      } else if (type === 'ringed-planet') {
        // Slightly slower for ringed planets
        orbitalPeriod = 2 * Math.PI * Math.sqrt(orbit.radius / (this.options.rotationSpeed * 0.6))
      } else {
        // Normal period for other bodies
        orbitalPeriod = 2 * Math.PI * Math.sqrt(orbit.radius / this.options.rotationSpeed)
      }
      
      // Update angle based on orbital period
      const angleChange = (deltaTime / orbitalPeriod) * 2 * Math.PI
      const previousAngle = entity.angle
      entity.angle = (entity.angle + angleChange) % (2 * Math.PI)
      

      
      // Calculate new position
      const newPosition = this.calculateSpiralPosition(
        orbit,
        entity.angle,
        armIndex
      )
      
      // Log position delta
      const positionDelta = {
        x: (newPosition.x - entity.position.x).toFixed(4),
        y: (newPosition.y - entity.position.y).toFixed(4),
        z: (newPosition.z - entity.position.z).toFixed(4)
      }

      // Update entity position
      entity.position.copy(newPosition)
  
      return entity
    }

    // Helper method to calculate orbital speed factor based on entity type
    calculateOrbitalSpeedFactor(entityType) {
      switch(entityType) {
        case 'major':
          return 0.2  // Slowest
        case 'ringed-planet':
          return 0.6  // Slower than normal
        case 'planet':
          return 1.0  // Normal speed
        case 'star':
          return 1.2  // Slightly faster
        case 'small-planet':
          return 1.5  // Fastest
        default:
          return 1.0
      }
    }
}
  
export default OrbitManager