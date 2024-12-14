import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Planet({
  position = [0, 0, 0],
  size = 1,
  color = '#4466ff',
  hasRings = false,
  rotationSpeed = 1
}) {
  const groupRef = useRef()
  const planetRef = useRef()
  const atmosphereRef = useRef()
  const ringsRef = useRef()
  const cloudsRef = useRef()
  
  const targetPos = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3())
  
  useEffect(() => {
    targetPos.current.set(...position)
    if (!currentPos.current.lengthSq()) {
      currentPos.current.set(...position)
    }
  }, [])

  useFrame((state, delta) => {
    targetPos.current.set(...position)
    
    if (groupRef.current) {
      const smoothing = Math.min(1, delta * 5)
      currentPos.current.lerp(targetPos.current, smoothing)
      groupRef.current.position.copy(currentPos.current)
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.1 * rotationSpeed
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.15 * rotationSpeed
    }

    if (atmosphereRef.current?.material.uniforms) {
      const viewVector = new THREE.Vector3().subVectors(
        state.camera.position,
        currentPos.current
      )
      atmosphereRef.current.material.uniforms.viewVector.value = viewVector
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={planetRef} castShadow receiveShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhongMaterial 
          color={color}
          specular={new THREE.Color(0x666666)}
          shininess={10}
        />
      </mesh>

      <mesh ref={cloudsRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshPhongMaterial
          color={color}
          transparent
          opacity={0.4}
        />
      </mesh>

      <mesh ref={atmosphereRef} scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[size, 32, 32]} />
        <shaderMaterial
          uniforms={{
            color: { value: new THREE.Color(color) },
            viewVector: { value: new THREE.Vector3() }
          }}
          vertexShader={`
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
              vec3 vNormal = normalize(normalMatrix * normal);
              vec3 vNormel = normalize(normalMatrix * viewVector);
              intensity = pow(0.63 - dot(vNormal, vNormel), 2.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 color;
            varying float intensity;
            void main() {
              gl_FragColor = vec4(color, 1.0) * intensity;
            }
          `}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent={true}
        />
      </mesh>

      {hasRings && (
        <mesh ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.4, size * 2.2, 64]} />
          <meshPhongMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}