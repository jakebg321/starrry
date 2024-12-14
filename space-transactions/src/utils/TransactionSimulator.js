export class TransactionSimulator {
    constructor(options = {}) {
        this.options = {
            ranges: {
                smallPlanet: { min: 0, max: 300, weight: 40 },
                regularPlanet: { min: 301, max: 500, weight: 30 },
                ringedPlanet: { min: 501, max: 1000, weight: 15 },
                star: { min: 1001, max: 5000, weight: 10 },
                major: { min: 5001, max: 50000, weight: 5 }
            },
            minAmount: options.minAmount || 100,
            maxAmount: options.maxAmount || 10000,
            minInterval: options.minInterval || 1000,
            maxInterval: options.maxInterval || 5000,
            batchSize: options.batchSize || 20  // Default batch size
        }
        
        this.listeners = new Set()
        this.isRunning = false
        this.timeout = null
        this.totalTransactions = 0
    }

    getEntityTypeForAmount(amount) {
        const { ranges } = this.options
        if (amount <= ranges.smallPlanet.max) return 'small-planet'
        if (amount <= ranges.regularPlanet.max) return 'planet'
        if (amount <= ranges.ringedPlanet.max) return 'ringed-planet'
        if (amount <= ranges.star.max) return 'star'
        return 'major'
    }

    getScaleForAmount(amount) {
        const { ranges } = this.options
        if (amount <= ranges.smallPlanet.max) return 0.5 + (Math.random() * 0.5) // 0.5 - 1.0
        if (amount <= ranges.regularPlanet.max) return 1.0 + (Math.random() * 0.5) // 1.0 - 1.5
        if (amount <= ranges.ringedPlanet.max) return 1.5 + (Math.random() * 0.5) // 1.5 - 2.0
        if (amount <= ranges.star.max) return 2.0 + (Math.random() * 1.0) // 2.0 - 3.0
        // Logarithmic growth for major entities
        return 3.0 + (Math.log(amount / ranges.major.min) * 2)
    }

    generateTransaction() {
        // Select range based on weights
        const ranges = Object.values(this.options.ranges)
        const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0)
        let random = Math.random() * totalWeight
        let selectedRange

        for (const range of ranges) {
            random -= range.weight
            if (random <= 0) {
                selectedRange = range
                break
            }
        }

        // Generate amount within selected range
        const amount = selectedRange.min + Math.random() * (selectedRange.max - selectedRange.min)
        const type = this.getEntityTypeForAmount(amount)
        const scale = this.getScaleForAmount(amount)

        return {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount,
            timestamp: Date.now(),
            type,
            scale,
            transactionType: Math.random() > 0.5 ? 'buy' : 'sell'
        }
    }

    // Generate a batch of transactions
    generateBatch(size) {
        const batch = []
        for (let i = 0; i < size; i++) {
            batch.push(this.generateTransaction())
        }
        return batch
    }

    // Simulate a batch of transactions
    simulateBatch(size) {
        const batch = this.generateBatch(size)
        batch.forEach(transaction => {
            this.totalTransactions++
            this.listeners.forEach(listener => listener(transaction))
        })
        return batch
    }

    subscribe(callback) {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    start() {
        if (this.isRunning) return
        this.isRunning = true
        this.scheduleNext()
    }

    stop() {
        this.isRunning = false
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
    }

    pause() {
        this.stop()
    }

    resume() {
        this.start()
    }

    // Get current transaction count
    getTransactionCount() {
        return this.totalTransactions
    }

    // Clear all transactions
    clear() {
        this.totalTransactions = 0
        this.stop()
        this.listeners.forEach(listener => listener({ type: 'clear' }))
    }

    scheduleNext() {
        if (!this.isRunning) return
        
        const delay = Math.random() * 
            (this.options.maxInterval - this.options.minInterval) + 
            this.options.minInterval
            
        this.timeout = setTimeout(() => {
            const transaction = this.generateTransaction()
            this.totalTransactions++
            this.listeners.forEach(listener => listener(transaction))
            this.scheduleNext()
        }, delay)
    }

    // Adjust simulation speed
    setSimulationSpeed(speedFactor) {
        this.options.minInterval = Math.max(100, 1000 / speedFactor)
        this.options.maxInterval = Math.max(500, 5000 / speedFactor)
        
        if (this.isRunning) {
            this.stop()
            this.start()
        }
    }

    // Adjust transaction amounts
    setTransactionRange(min, max) {
        this.options.minAmount = min
        this.options.maxAmount = max
    }
}