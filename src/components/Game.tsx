import React, { Suspense, useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { useSpring, config } from '@react-spring/core';
import { a } from '@react-spring/three';
import * as THREE from 'three';
import { useGLTF, useTexture } from '@react-three/drei';
import { RGBELoader } from 'three-stdlib';
import { DepthOfField, Noise, EffectComposer, Vignette, SSAO } from '@react-three/postprocessing';

function useEquirectangolarEnv(url: string) {
  const env = useLoader(RGBELoader as any, url);
  const { gl } = useThree();
  const envCube = useMemo(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();

    const envMap = pmremGenerator.fromEquirectangular(env).texture;
    pmremGenerator.dispose();

    return envMap;
  }, [env, gl]);

  return envCube;
}

function useEquirectangolarTex(url: string) {
  const env = useTexture(url);
  const { gl } = useThree();
  const envCube = useMemo(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();

    const envMap = pmremGenerator.fromEquirectangular(env).texture;
    pmremGenerator.dispose();

    return envMap;
  }, [env, gl]);

  return envCube;
}

function Road({ length = 400, t }) {
  const [roadDiffuse, roadBump, roadRough] = useTexture(['/game/road_diffuse.png', '/game/road_bump.png', '/game/road_rough.png']);
  const [sandDiffuse, sandAO, sandNormal, sandRough] = useTexture([
    '/game/sand_diffuse.jpg',
    '/game/sand_ao.jpg',
    '/game/sand_normal.jpg',
    '/game/sand_rough.jpg',
  ]);

  const handleUpdateRoad = useCallback(
    (material: THREE.MeshPhysicalMaterial) => {
      material.map.wrapS = THREE.RepeatWrapping;
      material.map.wrapT = THREE.RepeatWrapping;
      material.map.repeat.set(length / 10, 1);
      material.map.anisotropy = 4;
      material.map.needsUpdate = true;

      material.roughnessMap.wrapS = THREE.RepeatWrapping;
      material.roughnessMap.wrapT = THREE.RepeatWrapping;
      material.roughnessMap.repeat.set(length / 10, 1);
      material.roughnessMap.anisotropy = 4;
      material.roughnessMap.needsUpdate = true;

      material.normalMap.wrapS = THREE.RepeatWrapping;
      material.normalMap.wrapT = THREE.RepeatWrapping;
      material.normalMap.repeat.set(length / 10, 1);
      material.normalMap.anisotropy = 4;
      material.normalMap.needsUpdate = true;
    },
    [roadDiffuse, roadBump, roadRough],
  );

  const handleUpdateSand = useCallback(
    (material: THREE.MeshPhysicalMaterial) => {
      material.map.wrapS = THREE.RepeatWrapping;
      material.map.wrapT = THREE.RepeatWrapping;
      material.map.repeat.set((length / 10) * 2, 16);
      material.map.anisotropy = 4;
      material.map.needsUpdate = true;

      material.roughnessMap.wrapS = THREE.RepeatWrapping;
      material.roughnessMap.wrapT = THREE.RepeatWrapping;
      material.roughnessMap.repeat.set((length / 10) * 2, 16);
      material.roughnessMap.anisotropy = 4;
      material.roughnessMap.needsUpdate = true;

      material.normalMap.wrapS = THREE.RepeatWrapping;
      material.normalMap.wrapT = THREE.RepeatWrapping;
      material.normalMap.repeat.set((length / 10) * 2, 16);
      material.normalMap.anisotropy = 4;
      material.normalMap.needsUpdate = true;

      material.aoMap.wrapS = THREE.RepeatWrapping;
      material.aoMap.wrapT = THREE.RepeatWrapping;
      material.aoMap.repeat.set((length / 10) * 2, 16);
      material.aoMap.anisotropy = 4;
      material.aoMap.needsUpdate = true;
    },
    [sandDiffuse, sandNormal, sandRough],
  );

  return (
    <>
      <mesh position-z={-length / 2} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} receiveShadow>
        <planeGeometry attach='geometry' args={[length, 10, 4, 4]} />
        <meshPhysicalMaterial
          onUpdate={handleUpdateRoad}
          attach='material'
          map={roadDiffuse}
          map-offset-x={t / 10}
          normalMap={roadBump}
          normalMap-offset-x={t / 10}
          metalness={0}
          roughness={1}
          roughnessMap={roadRough}
          roughnessMap-offset-x={t / 10}
          fog={false}
        />
      </mesh>
      <mesh position-y={-0.5} position-z={-length / 2} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2} receiveShadow>
        <planeGeometry attach='geometry' args={[length, 200, 4, 4]} />
        <meshPhysicalMaterial
          onUpdate={handleUpdateSand}
          attach='material'
          map={sandDiffuse}
          map-offset-x={(t / 10) * 2}
          normalMap={sandNormal}
          normalMap-offset-x={(t / 10) * 2}
          metalness={0}
          roughness={1}
          roughnessMap={sandRough}
          roughnessMap-offset-x={(t / 10) * 2}
          aoMap={sandAO}
          // aoMap-offset-x={(t / 10) * 2}
          fog={false}
        />
      </mesh>
    </>
  );
}

function Car({ lane = 0 }) {
  const model: any = useGLTF('/game/car.glb', '/game/');

  const handleSceneUpdate = useCallback(
    (scene: THREE.Object3D) => {
      scene.castShadow = true;
      scene.traverse(child => {
        child.castShadow = true;
        if (child.isMesh && child.material) {
          child.geometry.center();
          // child.material.metalness = 0;
          child.material.needsUpdate = true;
          child.material.map.encoding = THREE.sRGBEncoding;
        }
      });
    },
    [model],
  );

  const { lanePos } = useSpring({
    lanePos: lane,
    config: config.slow,
  });

  const sceneRef = useRef<THREE.Object3D>(null);
  useFrame(({ clock }) => {
    if (!sceneRef.current) return;
    const offset = (x: number) =>
      -0.143 * Math.sin(1.75 * (x + 1.73)) -
      0.18 * Math.sin(2.96 * (x + 4.98)) -
      0.012 * Math.sin(6.23 * (x + 3.17)) +
      0.088 * Math.sin(8.07 * (x + 4.63)) +
      0.08 * Math.sin(x * 15);
    sceneRef.current.position.x = offset(clock.elapsedTime / 4);
    sceneRef.current.position.y = -offset(clock.elapsedTime / 2 + 6) / 4;
  });

  const scale = 0.015;
  return (
    <a.group position-x={lanePos.to(x => x * 3)} position-y={0.5} position-z={-5} rotation-y={lanePos.to(x => Math.sin(((x - lane) * Math.PI) / 8))}>
      <primitive
        ref={sceneRef}
        // position-z={-(280 / 8) * scale}
        onUpdate={handleSceneUpdate}
        scale={[scale, scale, scale]}
        rotation-z={Math.PI}
        object={model.nodes['desotoFBX']}
        dispose={null}
      />
    </a.group>
  );
}

const obstacleSize = 1.6;
function Obstacle({ x, z }) {
  const [diffuse, normal] = useTexture(['/game/crate_diffuse.png', '/game/crate_normal.png']);

  return (
    <mesh position-x={x} position-y={obstacleSize / 2} position-z={z} castShadow>
      <boxBufferGeometry attach='geometry' args={[obstacleSize, obstacleSize, obstacleSize]} />
      <meshPhysicalMaterial attach='material' map={diffuse} normalMap={normal} />
    </mesh>
  );
}

const farOffset = -100;
const count = 8;
function genBlock(time: number, spreadX = false) {
  return {
    x: (Math.floor(Math.random() * 3) - 1) * 3,
    z: 10,
    offsetZ: -time + farOffset + (spreadX ? Math.random() * -farOffset : 10),
    id: Math.random().toString(),
  };
}

function Scene({ currentLane }) {
  const { scene } = useThree();
  const envCube = useEquirectangolarEnv('/game/env.hdr');
  const background = useTexture('/game/quarry_crop.jpg');
  useEffect(() => {
    // scene.background = background;
    scene.environment = envCube;
    scene.fog = new THREE.Fog(0xefefef, 0, 200);
  }, [scene.fog, scene.background, envCube]);

  const [t, setT] = useState(0);
  const speed = 15.0;
  useFrame(({ clock }) => {
    setT(clock.elapsedTime * speed);
  });

  const [obstacles, setObstacles] = useState(new Array(count).fill(0).map(() => genBlock(0, true)));

  useFrame(({ clock }) => {
    setObstacles(prev => {
      const translated = prev.map(o => ({
        ...o,
        z: clock.elapsedTime * speed + o.offsetZ,
      }));

      const insideArea = translated.filter(o => o.z < 0);
      const news = insideArea.length >= count ? [] : new Array(count - insideArea.length).fill(0).map(() => genBlock(clock.elapsedTime * speed));

      return [...insideArea, ...news];
    });
  });

  return (
    <>
      <directionalLight
        castShadow
        position={[0, 800, -400]}
        intensity={10}
        shadow-camera-near={0.005}
        shadow-camera-far={2000}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={20}
        shadow-camera-bottom={-50}
      />
      <ambientLight intensity={0.4} />

      <Road t={t} />

      {obstacles.map(o => (
        <Obstacle key={o.id} x={o.x} z={o.z} />
      ))}

      <Car lane={currentLane} />

      <mesh position-y={-30} position-z={-200}>
        <planeBufferGeometry args={[800, 200, 1, 1]} />
        <meshBasicMaterial map={background} toneMapped={false} fog={false} />
      </mesh>
    </>
  );
}

export default function Game({ currentLane }) {
  return (
    <Canvas
      camera={{
        fov: 95,
        near: 0.1,
        far: 1000,
        position: [0, 6, 0],
        rotation: [-0.6, 0, 0],
      }}
      shadows
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.3;
      }}
    >
      <Suspense fallback={null}>
        <Scene currentLane={currentLane} />
        <EffectComposer>
          <SSAO />
          <DepthOfField focusDistance={0.01} focalLength={0.02} bokehScale={2} height={480} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.4} darkness={0.5} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
