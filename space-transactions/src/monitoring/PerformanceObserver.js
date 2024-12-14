export default class PerformanceObserver {
    constructor(telemetry) {
      this.telemetry = telemetry
      this.lastFpsUpdate = performance.now()
      this.frameCount = 0
      this.isObserving = false
    }
  
    startObserving() {
      if (this.isObserving) return
      this.isObserving = true
      this.observeFrame()
    }
  
    observeFrame() {
      if (!this.isObserving) return
  
      this.frameCount++
      const now = performance.now()
      const delta = now - this.lastFpsUpdate
  
      // Update FPS every second
      if (delta >= 1000) {
        const fps = (this.frameCount * 1000) / delta
        this.telemetry.capturePerformanceMetric('fps', fps)
        
        this.frameCount = 0
        this.lastFpsUpdate = now
      }
  
      requestAnimationFrame(() => this.observeFrame())
    }
  
    captureRenderStats(renderer) {
      if (!renderer) return
      
      const info = renderer.info
      this.telemetry.capturePerformanceMetric('drawCalls', info.render.calls)
      this.telemetry.capturePerformanceMetric('triangles', info.render.triangles)
      this.telemetry.capturePerformanceMetric('points', info.render.points)
    }
  }