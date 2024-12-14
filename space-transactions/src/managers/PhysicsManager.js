// src/managers/PhysicsManager.js
import * as THREE from 'three'

// Constants tuned for visual appeal
const GRAVITATIONAL_PARAMETER = 100
const BASE_ORBITAL_PERIOD = 60 // seconds
const MAX_ORBITAL_TILT = Math.PI / 6 // 30 degrees maximum tilt

class PhysicsManager {
  constructor(options = {}) {
    this.options = {
      maxTilt: options.maxTilt || MAX_ORBITAL_TILT,
      gravitationalParameter: options.gravitationalParameter || GRAVITATIONAL_PARAMETER,
      baseOrbitalPeriod: options.baseOrbitalPeriod || BASE_ORBITAL_PERIOD,
      ...options
    }
  }

  calculateKeplerianOrbit(transactionValue) {
    // Higher value = more elliptical orbit
    const eccentricity = Math.min(0.95, Math.log10(transactionValue) * 0.05)
    
    // Orbital tilt based on transaction value
    const tiltAngle = (Math.random() - 0.5) * this.options.maxTilt * 
      (1 + Math.log10(transactionValue) * 0.1)
    
    // Calculate orbital radius based on transaction value
    const minRadius = 20  // Increased minimum radius
    const maxRadius = 100
    const radius = minRadius + (Math.log10(transactionValue) / 5) * (maxRadius - minRadius)
    
    // Calculate orbital period (higher mass = faster orbit)
    const period = this.options.baseOrbitalPeriod * 
      Math.sqrt(Math.pow(radius / minRadius, 3))  // Kepler's Third Law
    
    // Calculate orbital velocity using circular orbit approximation
    const velocity = 2 * Math.PI * radius / period

    return {
      radius,
      eccentricity,
      period,
      velocity,
      tiltAngle,
      inclination: new THREE.Euler(tiltAngle, 0, 0)
    }
  }

  calculateCapturedOrbit(transactionValue, parentScale) {
    const orbit = this.calculateKeplerianOrbit(transactionValue)
    
    // Modify parameters for captured state
    orbit.radius = parentScale * (2 + Math.random() * 3) // 2-5x parent scale
    orbit.eccentricity *= 0.5  // More circular orbits
    orbit.period = this.options.baseOrbitalPeriod * 0.5  // Faster orbits
    orbit.velocity = 2 * Math.PI * orbit.radius / orbit.period  // Recalculate for new radius/period
    
    return orbit
  }

  calculateOrbitalPosition(orbit, angle) {
    // Calculate position in orbital plane
    const x = orbit.radius * Math.cos(angle)
    const z = orbit.radius * Math.sin(angle)
    const position = new THREE.Vector3(x, 0, z)

    // Apply orbital tilt
    position.applyEuler(orbit.inclination)
    
    return position
  }

  calculateVelocity(orbit, angle) {
    const velocity = new THREE.Vector3(
      -orbit.velocity * Math.sin(angle),
      0,
      orbit.velocity * Math.cos(angle)
    )
    
    // Apply same tilt as position
    velocity.applyEuler(orbit.inclination)
    
    return velocity
  }
}

export default PhysicsManager