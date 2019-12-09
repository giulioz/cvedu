import React, { useRef, Suspense } from "react";
import { useLoader } from "react-three-fiber";
import { TextureLoader } from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float opacity;
  uniform sampler2D tDiffuse;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    gl_FragColor = opacity * texel;
  }
`;

export default function FullscreenQuad({ texture }) {
  return (
    <Suspense fallback={null}>
      <mesh>
        <planeGeometry attach="geometry" args={[1, 1]} />
        <shaderMaterial
          attach="material"
          uniforms={{
            tDiffuse: { value: texture },
            opacity: { value: 1.0 }
          }}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </Suspense>
  );
}
