// src/environment/Nebula.jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Nebula({ 
    resolution = 256,
    color = '#4a2f6e',
    arms = 4,
    scale = 100,
    density = 0.5,
    smoothing = 0.2
  }) {
    const meshRef = useRef()
    const materialRef = useRef()
    const timeRef = useRef(0)
    const currentScaleRef = useRef(scale)
  
    // Update the useFrame hook to handle smooth scaling
    useFrame((state, delta) => {
      if (materialRef.current) {
        timeRef.current += state.clock.getDelta() * 0.2
        materialRef.current.uniforms.uTime.value = timeRef.current
  
        // Smooth scale transition
        const scaleDiff = scale - currentScaleRef.current
        if (Math.abs(scaleDiff) > 0.1) {
          currentScaleRef.current += scaleDiff * Math.min(delta / smoothing, 1)
          if (meshRef.current) {
            meshRef.current.scale.set(
              currentScaleRef.current, 
              currentScaleRef.current * 0.3, 
              currentScaleRef.current
            )
          }
        }
      }
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * 0.05
      }
    })
  // Create nebula material with custom shader
  const shaderMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uDensity: { value: density },
        uArms: { value: arms },
        uScale: { value: scale }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uDensity;
        uniform float uArms;
        uniform float uScale;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        //	Classic Perlin 3D Noise by Stefan Gustavson
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
        
        float cnoise(vec3 P){
          vec3 Pi0 = floor(P);
          vec3 Pi1 = Pi0 + vec3(1.0);
          Pi0 = mod(Pi0, 289.0);
          Pi1 = mod(Pi1, 289.0);
          vec3 Pf0 = fract(P);
          vec3 Pf1 = Pf0 - vec3(1.0);
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;
          
          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);
          
          vec4 gx0 = ixy0 / 7.0;
          vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);
          
          vec4 gx1 = ixy1 / 7.0;
          vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);
          
          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
          
          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;
          
          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);
          
          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }
        
        float spiral(vec3 position) {
          float r = length(position.xz);
          float theta = atan(position.z, position.x);
          float arms = uArms;
          float spiral = sin(theta * arms + r * 0.5 + uTime * 0.1);
          return spiral;
        }
        
        void main() {
          vec3 noisePos = vPosition / uScale;
          float noise1 = cnoise(noisePos + vec3(uTime * 0.05));
          float noise2 = cnoise(noisePos * 2.0 - vec3(uTime * 0.05));
          
          float spiralNoise = spiral(vPosition);
          float finalNoise = noise1 * 0.6 + noise2 * 0.4 + spiralNoise * 0.3;
          
          float density = smoothstep(-1.0, 1.0, finalNoise) * uDensity;
          density *= smoothstep(1.0, 0.0, length(vPosition.xz) / uScale);
          
          vec3 finalColor = mix(vec3(0.0), uColor, density);
          
          gl_FragColor = vec4(finalColor, density * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    
    materialRef.current = material
    return material
  }, [color, density, arms, scale])

  // Create geometry based on resolution
  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1, resolution <= 64 ? 3 : resolution <= 128 ? 4 : 5)
  }, [resolution])

  // Animate the nebula
  useFrame((state) => {
    if (materialRef.current) {
      timeRef.current += state.clock.getDelta() * 0.2
      materialRef.current.uniforms.uTime.value = timeRef.current
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += state.clock.getDelta() * 0.05
    }
  })

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      material={shaderMaterial}
      scale={[scale, scale * 0.3, scale]}
    />
  )
}