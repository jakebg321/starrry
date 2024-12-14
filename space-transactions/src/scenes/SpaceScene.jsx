// src/scenes/SpaceScene.jsx
import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Stars,
  AdaptiveDpr,
  AdaptiveEvents
} from '@react-three/drei'
import { 
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Star } from '../celestial/Star'
import { Planet } from '../celestial/Planet'
import { Nebula } from '../environment/Nebula'
import { TransactionSimulator } from '../utils/TransactionSimulator'
import SpaceTransactionCore from '../core/SpaceTransactionCore'
import * as THREE from 'three'
import Telemetry from '../monitoring/Telemetry'
import PerformanceObserver from '../monitoring/PerformanceObserver'
import SimulationControls from '../components/SimulationControls'
const QUALITY_CONFIGS = {
  high: {
    bloomIntensity: 1.5,
    nebulaResolution: 256,
    particleCount: 10000,
  },
  medium: {
    bloomIntensity: 1,
    nebulaResolution: 128,
    particleCount: 5000,
  },
  low: {
    bloomIntensity: 0.5,
    nebulaResolution: 64,
    particleCount: 2000,
  }
}

function GalaxyScene({ coreRef, simulatorRef }) {
  const [transactionEntities, setTransactionEntities] = useState([])
  const entitiesRef = useRef(new Map())
  const [quality, setQuality] = useState('high')
  const [galaxyRadius, setGalaxyRadius] = useState(50)
  const telemetryRef = useRef(new Telemetry())
  const performanceObserverRef = useRef(null)

  // Initialize core, simulator, and telemetry
  useEffect(() => {
    // Initialize performance monitoring
    performanceObserverRef.current = new PerformanceObserver(telemetryRef.current)
    performanceObserverRef.current.startObserving()

    // Handle new transactions
    const handleTransaction = (transaction) => {
      if (coreRef.current) {
        const entity = coreRef.current.processTransaction(transaction)
        if (entity) {
          setTransactionEntities(prev => [...prev, entity])
          entitiesRef.current.set(entity.id, entity)
          // Track new entity creation
          telemetryRef.current.captureMetric('entity', 'created', {
            type: entity.type,
            transactionAmount: transaction.amount
          })
        }
      }
    }

    // Handle galaxy scaling
    const handleGalaxyScaled = (newRadius) => {
      setGalaxyRadius(newRadius)
      // Track galaxy scaling
      telemetryRef.current.captureMetric('galaxy', 'scaled', {
        newRadius,
        entityCount: transactionEntities.length
      })
    }

    // Subscribe to events
    const unsubscribeTransaction = simulatorRef.current.subscribe(handleTransaction)
    coreRef.current.on('galaxyScaled', handleGalaxyScaled)
    
    // Detect quality
    const detectQuality = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const newQuality = isMobile ? 'low' : window.devicePixelRatio > 1 ? 'high' : 'medium'
      setQuality(newQuality)
      // Track quality setting
      telemetryRef.current.captureMetric('system', 'quality', {
        level: newQuality,
        isMobile,
        pixelRatio: window.devicePixelRatio
      })
    }
    detectQuality()

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.isObserving = false
      }
      unsubscribeTransaction()
      coreRef.current.removeListener('galaxyScaled', handleGalaxyScaled)
    }
  }, [])

  // Update frame with performance monitoring
  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.update(delta)
      
      // Update existing entities' positions without recreating array
      setTransactionEntities(prev => {
        return prev.map(entity => {
          const updated = entitiesRef.current.get(entity.id)
          return updated || entity
        })
      })
    }
    
    // Capture render stats
    if (performanceObserverRef.current) {
      performanceObserverRef.current.captureRenderStats(state.gl)
      telemetryRef.current.captureMetric('render', 'frame', {
        delta,
        entityCount: transactionEntities.length,
        quality
      })
    }
  })

  return (
    <>
      <color attach="background" args={['#000008']} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={200}
        maxPolarAngle={Math.PI * 0.6}
        onChange={() => {
          // Track camera changes
          telemetryRef.current.captureInteraction('camera', 'moved')
        }}
      />

      {/* Lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Core brightness */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={5}
        distance={100}
        decay={2}
      />

      {/* Galaxy Group */}
      <group>
        {/* Galactic Core */}
        <Star 
          position={[0, 0, 0]}
          size={4}
          color="#fffae0"
          intensity={3}
        />

        {/* Nebula effects */}
        <Nebula 
          resolution={QUALITY_CONFIGS[quality].nebulaResolution}
          color="#4a2f6e"
          arms={4}
          scale={galaxyRadius}
          density={0.5}
          smoothing={0.2}
        />

        {/* Transaction Entities */}
        {transactionEntities.map((entity) => (
          entity.type === 'star' || entity.type === 'major' ? (
            <Star 
              key={entity.id}
              position={entity.position}
              size={entity.scale}
              color={entity.color || '#ffff00'}
              intensity={entity.type === 'major' ? 2 : 1}
              orbit={entity.orbit}
            />
          ) : (
            <Planet 
              key={entity.id}
              position={entity.position}
              size={entity.scale}
              color={entity.color || '#4466ff'}
              hasRings={entity.type === 'ringed-planet'}
              orbit={entity.orbit}
              rotationSpeed={1}
            />
          )
        ))}
      </group>

      {/* Background stars */}
      <Stars 
        radius={300}
        depth={100}
        count={QUALITY_CONFIGS[quality].particleCount}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom 
          intensity={QUALITY_CONFIGS[quality].bloomIntensity}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.SCREEN}
        />
        <ChromaticAberration 
          offset={[0.002, 0.002]}
          blendFunction={BlendFunction.NORMAL}
          opacity={0.3}
        />
        <Vignette
          darkness={0.5}
          offset={0.1}
        />
      </EffectComposer>
    </>
    
  )
}

export default function SpaceScene() {
  const coreRef = useRef(null)
  const simulatorRef = useRef(null)

  useEffect(() => {
    // Initialize core and simulator
    coreRef.current = new SpaceTransactionCore({
      maxEntities: 1000,
      galaxyArms: 4,
      galaxyPitch: 0.2,
      spiralTightness: 0.1,
      galaxyScale: 100,
      verticalScale: 0.1,
      rotationSpeed: 10.5,
      minTransactionValue: 1
    })

    simulatorRef.current = new TransactionSimulator({
      minAmount: 500,
      maxAmount: 10000,
      minInterval: 1000,
      maxInterval: 3000
    })
    
    // Start systems
    coreRef.current.start()
    simulatorRef.current.start()

    return () => {
      coreRef.current.stop()
      simulatorRef.current.stop()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ position: [50, 30, 50], fov: 60, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <GalaxyScene coreRef={coreRef} simulatorRef={simulatorRef} />
      </Canvas>
      <SimulationControls 
        core={coreRef.current} 
        simulator={simulatorRef.current}
      />
    </div>
  )
}