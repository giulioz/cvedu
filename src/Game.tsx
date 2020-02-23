import React, { Suspense, useMemo, useEffect, useState } from "react";
import {
  Canvas,
  useLoader,
  useFrame,
  useThree,
  useUpdate,
} from "react-three-fiber";
import { useSpring, config } from "@react-spring/core";
import { a } from "@react-spring/three";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

function useEquirectangolarEnv(url) {
  const env = useLoader(RGBELoader, url);
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

function Road({ length = 400, envCube, t }) {
  const [diffuse, bump, rough] = (useLoader as any)(THREE.TextureLoader, [
    "/game/road_diffuse.png",
    "/game/road_bump.png",
    "/game/road_rough.png",
  ]);

  const materialRef = useUpdate<THREE.MeshPhysicalMaterial>(
    material => {
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
    [diffuse, bump, rough]
  );

  return (
    <mesh
      receiveShadow
      position-z={-length / 2}
      rotation-x={-Math.PI / 2}
      rotation-z={Math.PI / 2}
    >
      <planeGeometry attach="geometry" args={[length, 10]} />
      <meshPhysicalMaterial
        ref={materialRef}
        attach="material"
        map={diffuse}
        roughnessMap={rough}
        normalMap={bump}
        map-offset-x={t / 10}
        roughnessMap-offset-x={t / 10}
        normalMap-offset-x={t / 10}
        envMap={envCube}
        envMapIntensity={0.5}
        fog={false}
      />
    </mesh>
  );
}

function Car({ lane = 0, envCube }) {
  const model: any = useLoader(
    GLTFLoader,
    "/game/car.glb",
    (loader: GLTFLoader) => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/game/");
      loader.setDRACOLoader(dracoLoader);
    }
  );

  const sceneRef = useUpdate<any>(
    scene => {
      scene.traverse(child => {
        if (child.isMesh && child.material) {
          child.geometry.center();
          child.material.envMap = envCube;
          child.material.envMapIntensity = 0.5;
          child.receiveShadow = true;
          child.castShadow = true;
          child.material.metalness = 0;
          child.material.needsUpdate = true;
        }
      });
    },
    [model]
  );

  const { lanePos } = useSpring({
    lanePos: lane,
    config: config.slow,
  });

  useFrame(({ clock }) => {
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
    <a.group
      position-x={lanePos.to(x => x * 3)}
      position-y={0.5}
      position-z={-5}
      rotation-y={lanePos.to(x => Math.sin(((x - lane) * Math.PI) / 4))}
    >
      <a.primitive
        // position-z={-(280 / 8) * scale}
        ref={sceneRef}
        scale={[scale, scale, scale]}
        rotation-z={Math.PI}
        object={model.nodes["desotoFBX"]}
        dispose={null}
      />
    </a.group>
  );
}

const obstacleSize = 1.6;
function Obstacle({ envCube, x, z }) {
  const [diffuse, normal] = (useLoader as any)(THREE.TextureLoader, [
    "/game/crate_diffuse.png",
    "/game/crate_normal.png",
  ]);

  return (
    <mesh
      position-x={x}
      position-y={obstacleSize / 2}
      position-z={z}
      castShadow
      receiveShadow
    >
      <boxBufferGeometry
        attach="geometry"
        args={[obstacleSize, obstacleSize, obstacleSize]}
      />
      <meshPhysicalMaterial
        attach="material"
        map={diffuse}
        normalMap={normal}
        envMap={envCube}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

const farOffset = -100;
const count = 8;
function genBlock(time, spreadX = false) {
  return {
    x: (Math.floor(Math.random() * 3) - 1) * 3,
    z: 0,
    offsetZ: -time + farOffset + (spreadX ? Math.random() * -farOffset : 0),
    id: Math.random().toString(),
  };
}

function Scene({ currentLane }) {
  const { scene } = useThree();
  const envCube = useEquirectangolarEnv("/game/env.hdr");
  useEffect(() => {
    scene.background = envCube;
    scene.fog = new THREE.Fog(0xefefef, 0, 200);
  }, [scene.fog, scene.background, envCube]);

  const [t, setT] = useState(0);
  const speed = 15.0;
  useFrame(({ clock }) => {
    setT(clock.elapsedTime * speed);
  });

  const [obstacles, setObstacles] = useState(
    new Array(count).fill(0).map(() => genBlock(0, true))
  );

  useFrame(({ clock }) => {
    setObstacles(prev => {
      const translated = prev.map(o => ({
        ...o,
        z: clock.elapsedTime * speed + o.offsetZ,
      }));

      const insideArea = translated.filter(o => o.z < 0);
      const news =
        insideArea.length >= count
          ? []
          : new Array(count - insideArea.length)
              .fill(0)
              .map(() => genBlock(clock.elapsedTime * speed));

      return [...insideArea, ...news];
    });
  });

  return (
    <>
      <pointLight
        intensity={0.5}
        position={[0, 80, -70]}
        castShadow
        shadow-mapSize-width={2048 * 2}
        shadow-mapSize-height={2048 * 2}
      />

      <Road envCube={envCube} t={t} />

      {obstacles.map(o => (
        <Obstacle key={o.id} envCube={envCube} x={o.x} z={o.z} />
      ))}

      <Car envCube={envCube} lane={currentLane} />
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
        position: [0, 5, 0],
        rotation: [-0.5, 0, 0],
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.toneMapping = THREE.Uncharted2ToneMapping;
      }}
    >
      <Suspense fallback={null}>
        <Scene currentLane={currentLane} />
      </Suspense>
    </Canvas>
  );
}
