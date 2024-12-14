import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Star({ 
  position = [0, 0, 0],
  size = 1,
  color = '#ffff00',
  intensity = 1
}) {
  const starRef = useRef()
  const glowRef = useRef()

  useFrame((state, delta) => {
    if (glowRef.current) {
      glowRef.current.rotation.z += delta * 0.1
      glowRef.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Core */}
      <mesh ref={starRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial 
          color={color}
          toneMapped={false}
        />
      </mesh>

      {/* Glow */}
      <mesh ref={glowRef} scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Light source */}
      <pointLight 
        color={color} 
        intensity={intensity} 
        distance={50} 
      />
    </group>
  )
}