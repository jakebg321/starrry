// src/managers/EntityManager.js
import * as THREE from 'three'

class EntityManager {
  constructor(options = {}) {
    this.options = {
      maxEntities: options.maxEntities || 1000,
      ...options
    }
    
    this.entities = new Map()
    this.totalEntities = 0
  }

  createEntity({ orbit, armIndex, angle, scale, type, data }) {
    const entity = {
      id: `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: new THREE.Vector3(),
      orbit,
      armIndex,
      angle,
      scale,
      type,
      data,
      parentId: null,
      color: this.generateEntityColor(type, data.amount),
      created: Date.now()
    }
    
    this.entities.set(entity.id, entity)
    this.totalEntities++
    
    return entity
  }

  generateEntityColor(type, amount) {
    switch(type) {
      case 'major':
        // Bright white-yellow for major transactions
        return `hsl(60, 100%, ${80 + (Math.log10(amount) * 2)}%)`
      case 'star':
        // Warm colors for stars
        const starHue = 60 + (Math.log10(amount) - 3) * 20
        return `hsl(${starHue}, 100%, 70%)`
      case 'ringed-planet':
        // Cool colors for ringed planets
        return `hsl(${180 + Math.random() * 60}, 70%, 60%)`
      default:
        // Varied colors for regular planets
        return `hsl(${Math.random() * 360}, 70%, 60%)`
    }
  }

  getEntity(id) {
    return this.entities.get(id)
  }

  getEntities() {
    return Array.from(this.entities.values())
  }

  updateEntity(id, updates) {
    const entity = this.entities.get(id)
    if (entity) {
      Object.assign(entity, updates)
      return entity
    }
    return null
  }

  removeEntity(id) {
    if (this.entities.delete(id)) {
      this.totalEntities--
      return true
    }
    return false
  }

  clear() {
    this.entities.clear()
    this.totalEntities = 0
  }

  // Get entities within a certain age
  getRecentEntities(maxAge) {
    const now = Date.now()
    return this.getEntities().filter(entity => 
      now - entity.created <= maxAge
    )
  }

  // Get oldest entities beyond a certain count
  getOldestEntities(keepCount) {
    if (this.totalEntities <= keepCount) return []
    
    return this.getEntities()
      .sort((a, b) => a.created - b.created)
      .slice(0, this.totalEntities - keepCount)
  }

  // Prune old entities to maintain performance
  pruneOldEntities(keepCount) {
    const entitiesToRemove = this.getOldestEntities(keepCount)
    entitiesToRemove.forEach(entity => this.removeEntity(entity.id))
    return entitiesToRemove.length
  }

  // Get total count
  getCount() {
    return this.totalEntities
  }

  setEntityParent(entityId, parentId) {
    const entity = this.entities.get(entityId)
    if (entity) {
      console.log('---CAPTURE EVENT---')
      console.log(`Entity ${entityId} captured by ${parentId}`)
      console.log('Previous orbital params:', {
        radius: entity.orbit.radius,
        angle: entity.angle,
        position: entity.position.toArray()
      })
      
      entity.parentId = parentId
      return true
    }
    return false
  }
}

export default EntityManager