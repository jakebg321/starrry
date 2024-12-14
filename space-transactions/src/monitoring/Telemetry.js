// src/monitoring/Telemetry.js
export default class Telemetry {
    constructor() {
      this.metrics = {
        performance: new Map(),
        errors: new Map(),
        userInteractions: new Map(),
        systemInfo: null
      }
      
      this.batchSize = 50
      this.batchQueue = []
      this.isReporting = false
      
      // Initialize system info once
      this.systemInfo = this.captureSystemInfo()
    }
  
    captureSystemInfo() {
      return {
        userAgent: navigator.userAgent,
        deviceMemory: navigator?.deviceMemory || 'unknown',
        hardwareConcurrency: navigator?.hardwareConcurrency || 'unknown',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        devicePixelRatio: window.devicePixelRatio,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      }
    }
  
    captureMetric(category, name, value) {
      const timestamp = Date.now()
      const metric = {
        category,
        name,
        value,
        timestamp,
        systemInfo: this.systemInfo
      }
  
      // For now, just console.log the metrics
      
      this.batchQueue.push(metric)
      
      if (this.batchQueue.length >= this.batchSize) {
        this.reportBatch()
      }
    }
  
    capturePerformanceMetric(name, value) {
      this.captureMetric('performance', name, value)
    }
  
    captureError(error, context = {}) {
      this.captureMetric('error', error.message, {
        stack: error.stack,
        context
      })
    }
  
    captureInteraction(name, details) {
      this.captureMetric('interaction', name, details)
    }
  
    async reportBatch() {
      if (this.isReporting || this.batchQueue.length === 0) return
  
      this.isReporting = true
      const batch = this.batchQueue.splice(0, this.batchSize)
  
      // For now, just log the batch
      
      this.isReporting = false
    }
  }