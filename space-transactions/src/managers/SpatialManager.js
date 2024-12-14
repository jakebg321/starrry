// src/managers/SpatialManager.js
import * as THREE from 'three'

class QuadTree {
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.bounds = bounds
    this.maxObjects = maxObjects
    this.maxLevels = maxLevels
    this.level = level
    this.objects = []
    this.nodes = []
  }

  split() {
    const subWidth = this.bounds.width / 2
    const subHeight = this.bounds.height / 2
    const x = this.bounds.x
    const y = this.bounds.y

    this.nodes[0] = new QuadTree(
      { x: x + subWidth, y: y, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    )

    this.nodes[1] = new QuadTree(
      { x: x, y: y, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    )

    this.nodes[2] = new QuadTree(
      { x: x, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    )

    this.nodes[3] = new QuadTree(
      { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    )
  }

  getIndex(rect) {
    let index = -1
    const verticalMidpoint = this.bounds.x + (this.bounds.width / 2)
    const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2)

    const topQuadrant = (rect.y < horizontalMidpoint && rect.y + rect.height < horizontalMidpoint)
    const bottomQuadrant = (rect.y > horizontalMidpoint)

    if (rect.x < verticalMidpoint && rect.x + rect.width < verticalMidpoint) {
      if (topQuadrant) index = 1
      else if (bottomQuadrant) index = 2
    }
    else if (rect.x > verticalMidpoint) {
      if (topQuadrant) index = 0
      else if (bottomQuadrant) index = 3
    }

    return index
  }

  insert(rect) {
    if (this.nodes.length) {
      const index = this.getIndex(rect)
      if (index !== -1) {
        this.nodes[index].insert(rect)
        return
      }
    }

    this.objects.push(rect)

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (!this.nodes.length) {
        this.split()
      }

      let i = 0
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i])
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0])
        } else {
          i++
        }
      }
    }
  }

  retrieve(rect) {
    let returnObjects = []
    const index = this.getIndex(rect)

    if (this.nodes.length) {
      if (index !== -1) {
        returnObjects = returnObjects.concat(this.nodes[index].retrieve(rect))
      } else {
        for (let i = 0; i < this.nodes.length; i++) {
          returnObjects = returnObjects.concat(this.nodes[i].retrieve(rect))
        }
      }
    }

    returnObjects = returnObjects.concat(this.objects)
    return returnObjects
  }

  clear() {
    this.objects = []
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]) {
        this.nodes[i].clear()
      }
    }
    this.nodes = []
  }
}

class SpatialManager {
  constructor(bounds) {
    this.quadTree = new QuadTree(bounds)
    this.frustumHelper = new THREE.Frustum()
    this.projScreenMatrix = new THREE.Matrix4()
  }

  insert(entity) {
    this.quadTree.insert({
      x: entity.position.x,
      y: entity.position.z,
      width: entity.scale,
      height: entity.scale,
      data: entity
    })
  }

  query(camera, viewDistance) {
    // Update projection matrix
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    this.frustumHelper.setFromProjectionMatrix(this.projScreenMatrix)

    return this.quadTree.retrieve({
      x: camera.position.x - viewDistance,
      y: camera.position.z - viewDistance,
      width: viewDistance * 2,
      height: viewDistance * 2
    }).filter(item => {
      const point = new THREE.Vector3(
        item.data.position.x,
        item.data.position.y,
        item.data.position.z
      )
      return this.frustumHelper.containsPoint(point)
    })
  }

  clear() {
    this.quadTree.clear()
  }
}

export default SpatialManager