import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function EnergyStream({
  start = [0, 0, 0],
  end = [0, 0, 0],
  color = '#00ffff',
  strength = 1,
}) {
  const streamRef = useRef()
  const materialRef = useRef()

  // Create curve points with multiple control points for more interesting path
  const { points, curve } = useMemo(() => {
    const startVec = new THREE.Vector3(...start)
    const endVec = new THREE.Vector3(...end)
    const distance = startVec.distanceTo(endVec)
    
    // Create multiple control points for more organic curve
    const midPoint = new THREE.Vector3().lerpVectors(startVec, endVec, 0.5)
    const offset = distance * 0.3
    
    // Add some randomization to control points
    midPoint.y += offset
    midPoint.x += (Math.random() - 0.5) * offset
    midPoint.z += (Math.random() - 0.5) * offset

    const curve = new THREE.CubicBezierCurve3(
      startVec,
      new THREE.Vector3().lerpVectors(startVec, midPoint, 0.25),
      new THREE.Vector3().lerpVectors(endVec, midPoint, 0.25),
      endVec
    )

    return { curve, points: curve.getPoints(50) }
  }, [start.join(','), end.join(',')])

  // Create geometry
  const geometry = useMemo(() => {
    const geometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false)
    return geometry
  }, [curve])

  // Animation
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  // Custom shader material for energy effect
  const energyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        time: { value: 0 },
        strength: { value: strength }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float strength;
        varying vec2 vUv;
        
        void main() {
          float flow = fract(vUv.x * 2.0 - time);
          float intensity = sin(flow * 3.14159) * strength;
          vec3 finalColor = color * intensity;
          gl_FragColor = vec4(finalColor, intensity * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [color, strength])

  useEffect(() => {
    materialRef.current = energyMaterial
  }, [energyMaterial])

  return (
    <mesh ref={streamRef} geometry={geometry} material={energyMaterial} />
  )
}