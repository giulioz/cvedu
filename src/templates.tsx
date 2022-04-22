import React from 'react';

import { BlockInfo, IOPortInfo } from './App';
import { formatCode, getFunctionFromCode } from './utils/codeUtils';
import { NumberInputHelper, UVInputHelper, FrameInputHelper } from './components/InputHelpers';
import { Block, BlockTemplate } from './components/BlockEditor';

export const templatesInitial: BlockTemplate<BlockInfo, IOPortInfo>[] = [
  {
    type: 'CameraInput',
    hardcoded: true,
    customInput: false,
    code: '',
    solution: '',
    color: '#422828',
    inputs: [],
    outputs: [
      {
        label: 'Frame',
        type: 'output' as const,
        valueType: 'imagedata' as const,
      },
    ],
  },

  {
    type: 'NumericInput',
    hardcoded: true,
    customInput: true,
    code: '',
    solution: '',
    color: '#423f28',
    customRenderer: (
      block: Block<BlockInfo, IOPortInfo>,
      {
        customValues,
        setCustomValues,
      }: {
        customValues: { [key: string]: any };
        setCustomValues: (fn: (old: { [key: string]: any }) => { [key: string]: any }) => void;
      },
    ) => <NumberInputHelper customValues={customValues} setCustomValues={setCustomValues} block={block} minValue={0} maxValue={100} step={0.01} />,
    inputs: [],
    outputs: [
      {
        label: 'Number',
        type: 'output' as const,
        valueType: 'number' as const,
      },
    ],
  },

  {
    type: 'UVInput',
    hardcoded: true,
    customInput: true,
    code: '',
    solution: '',
    color: '#423f28',
    customRenderer: (
      block: Block<BlockInfo, IOPortInfo>,
      {
        customValues,
        setCustomValues,
      }: {
        customValues: { [key: string]: any };
        setCustomValues: (fn: (old: { [key: string]: any }) => { [key: string]: any }) => void;
      },
    ) => <UVInputHelper customValues={customValues} setCustomValues={setCustomValues} block={block} />,
    inputs: [],
    outputs: [
      {
        label: 'U',
        type: 'output' as const,
        valueType: 'number' as const,
      },
      {
        label: 'V',
        type: 'output' as const,
        valueType: 'number' as const,
      },
    ],
  },

  {
    type: 'FrameInput',
    hardcoded: true,
    customInput: true,
    code: '',
    solution: '',
    color: '#423f28',
    customRenderer: (
      block: Block<BlockInfo, IOPortInfo>,
      {
        customValues,
        setCustomValues,
      }: {
        customValues: { [key: string]: any };
        setCustomValues: (fn: (old: { [key: string]: any }) => { [key: string]: any }) => void;
      },
    ) => <FrameInputHelper customValues={customValues} setCustomValues={setCustomValues} block={block} />,
    inputs: [],
    outputs: [
      {
        label: 'Frame',
        type: 'output' as const,
        valueType: 'imagedata' as const,
      },
    ],
  },

  {
    type: 'DisplayFrame',
    hardcoded: true,
    customInput: false,
    code: '',
    solution: '',
    color: '#284042',
    inputs: [
      {
        label: 'Frame',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
    ],
    outputs: [],
  },

  {
    type: 'Game',
    hardcoded: true,
    customInput: false,
    code: '',
    solution: '',
    color: '#284042',
    inputs: [
      {
        label: 'Angle',
        type: 'input' as const,
        valueType: 'number' as const,
      },
    ],
    outputs: [],
  },

  {
    type: 'ChromaComposite',
    hardcoded: false,
    customInput: false,
    code: `let data: ImageData | null = null;

    function ChromaComposite({
      Mask,
      FrameA,
      FrameB,
    }: {
      Mask: { data: Uint8ClampedArray; width: number; height: number };
      FrameA: ImageData;
      FrameB: ImageData;
    }): { Frame: ImageData } {
      if (!data) {
        data = new ImageData(FrameA.width, FrameA.height);
      }
    
      for (let i = 0; i < Mask.width * Mask.height * 4; i += 4) {
        // INSERT YOUR CODE HERE
      }
    
      return { Frame: data };
    }
    `,
    solution: `let data: ImageData | null = null;

    function ChromaComposite({
      Mask,
      FrameA,
      FrameB,
    }: {
      Mask: { data: Uint8ClampedArray; width: number; height: number };
      FrameA: ImageData;
      FrameB: ImageData;
    }): { Frame: ImageData } {
      if (!data) {
        data = new ImageData(FrameA.width, FrameA.height);
      }
    
      for (let i = 0; i < Mask.width * Mask.height * 4; i += 4) {
        const isActive = Mask.data[i / 4];
    
        if (isActive) {
          data.data[i] = FrameA.data[i];
          data.data[i + 1] = FrameA.data[i + 1];
          data.data[i + 2] = FrameA.data[i + 2];
          data.data[i + 3] = FrameA.data[i + 3];
        } else {
          data.data[i] = FrameB.data[i];
          data.data[i + 1] = FrameB.data[i + 1];
          data.data[i + 2] = FrameB.data[i + 2];
          data.data[i + 3] = FrameB.data[i + 3];
        }
      }
    
      return { Frame: data };
    }
    `,
    inputs: [
      {
        label: 'Mask',
        type: 'input' as const,
        valueType: 'mask' as const,
      },
      {
        label: 'FrameA',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
      {
        label: 'FrameB',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
    ],
    outputs: [
      {
        label: 'Frame',
        type: 'output' as const,
        valueType: 'imagedata' as const,
      },
    ],
  },

  {
    type: 'RGBtoYUV',
    hardcoded: false,
    customInput: false,
    code: `let buffer: ImageData | null = null;

    function RGBtoYUV({ Frame }: { Frame: ImageData }): { YUVFrame: ImageData } {
      if (!buffer) {
        buffer = new ImageData(Frame.width, Frame.height);
      }
    
      // For each pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        // Extract the RGB values
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        // Calculates the YUV values with a matrix multiplication
        const Y = 0.257 * R + 0.504 * G + 0.098 * B + 16;
        const U = -0.148 * R - 0.291 * G + 0.439 * B + 128;
        const V = 0.439 * R - 0.368 * G - 0.071 * B + 128;
    
        // Saves the YUV values in the new image
        buffer.data[i] = Y;
        buffer.data[i + 1] = U;
        buffer.data[i + 2] = V;
        buffer.data[i + 3] = 255;
      }
    
      return { YUVFrame: buffer };
    }
    `,
    solution: `let buffer: ImageData | null = null;

    function RGBtoYUV({ Frame }: { Frame: ImageData }): { YUVFrame: ImageData } {
      if (!buffer) {
        buffer = new ImageData(Frame.width, Frame.height);
      }
    
      // For each pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        // Extract the RGB values
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        // Calculates the YUV values with a matrix multiplication
        const Y = 0.257 * R + 0.504 * G + 0.098 * B + 16;
        const U = -0.148 * R - 0.291 * G + 0.439 * B + 128;
        const V = 0.439 * R - 0.368 * G - 0.071 * B + 128;
    
        // Saves the YUV values in the new image
        buffer.data[i] = Y;
        buffer.data[i + 1] = U;
        buffer.data[i + 2] = V;
        buffer.data[i + 3] = 255;
      }
    
      return { YUVFrame: buffer };
    }
    `,
    inputs: [
      {
        label: 'Frame',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
    ],
    outputs: [
      {
        label: 'YUVFrame',
        type: 'output' as const,
        valueType: 'imagedata' as const,
      },
    ],
  },

  {
    type: 'ChromaKeyUV',
    hardcoded: false,
    customInput: false,
    code: `let data: Uint8ClampedArray | null = null;

    function ChromaKeyUV({
      YUVFrame,
      pU,
      pV,
      radius,
    }: {
      YUVFrame: ImageData;
      pU: number;
      pV: number;
      radius: number;
    }): { Mask: { data: Uint8ClampedArray; width: number; height: number } } {
      if (!data) {
        data = new Uint8ClampedArray(YUVFrame.width * YUVFrame.height).fill(0);
      }
    
      for (let i = 0; i < YUVFrame.data.length; i += 4) {
        // INSERT YOUR CODE HERE
      }
    
      return { Mask: { data, width: YUVFrame.width, height: YUVFrame.height } };
    }
    `,
    solution: `let data: Uint8ClampedArray | null = null;

    function ChromaKeyUV({
      YUVFrame,
      pU,
      pV,
      radius,
    }: {
      YUVFrame: ImageData;
      pU: number;
      pV: number;
      radius: number;
    }): { Mask: { data: Uint8ClampedArray; width: number; height: number } } {
      if (!data) {
        data = new Uint8ClampedArray(YUVFrame.width * YUVFrame.height).fill(0);
      }
    
      for (let i = 0; i < YUVFrame.data.length; i += 4) {
        // Gets the U and V for that pixel
        const U = YUVFrame.data[i + 1];
        const V = YUVFrame.data[i + 2];
    
        // Calculate the distances from the U,V values of the pixel and the desired ones
        const du = U - pU;
        const dv = V - pV;
    
        // Calculate the sum of the squared distances (pythagora's theorem)
        const d2 = du * du + dv * dv;
    
        // And the square of the radius (avoids square root)
        const r2 = radius * radius;
    
        // If the squared distance is less than the squared radius, then the pixel is valid
        data[i / 4] = d2 < r2 ? 255 : 0;
      }
    
      return { Mask: { data, width: YUVFrame.width, height: YUVFrame.height } };
    }
    `,
    inputs: [
      {
        label: 'YUVFrame',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
      {
        label: 'pU',
        type: 'input' as const,
        valueType: 'number' as const,
      },
      {
        label: 'pV',
        type: 'input' as const,
        valueType: 'number' as const,
      },
      {
        label: 'radius',
        type: 'input' as const,
        valueType: 'number' as const,
      },
    ],
    outputs: [
      {
        label: 'Mask',
        type: 'output' as const,
        valueType: 'mask' as const,
      },
    ],
  },

  {
    type: 'Hough',
    hardcoded: false,
    customInput: false,
    code: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;
    
    // Accumulator
    const alpha_steps = Math.round(Math.PI / a_step) + 1;
    const r_steps = Math.round((max_r * 2.0) / r_step) + 1;
    const accData = new Float32Array(alpha_steps * r_steps);
    
    function Hough({
      YUVFrame,
      Mask,
    }: {
      YUVFrame: ImageData;
      Mask: { data: Uint8ClampedArray; width: number; height: number };
    }): {
      Accumulator: {
        data: Float32Array;
        width: number;
        height: number;
        alpha_steps: number;
        r_steps: number;
      };
    } {
      // Clear accumulator
      accData.fill(0);
    
      for (let i = 0; i < YUVFrame.data.length; i += 4) {
        const maskValue = Mask.data[i / 4];
        const imgY = YUVFrame.data[i + 0];
    
        const x = (i / 4) % YUVFrame.width;
        const y = Math.floor(i / 4 / YUVFrame.width);
    
        // INSERT YOUR CODE HERE
      }
    
      return {
        Accumulator: {
          data: accData,
          width: Mask.width,
          height: Mask.height,
          alpha_steps,
          r_steps,
        },
      };
    }`,
    solution: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;
    
    // Accumulator
    const alpha_steps = Math.round(Math.PI / a_step) + 1;
    const r_steps = Math.round((max_r * 2.0) / r_step) + 1;
    const accData = new Float32Array(alpha_steps * r_steps);
    
    function Hough({
      YUVFrame,
      Mask,
    }: {
      YUVFrame: ImageData;
      Mask: { data: Uint8ClampedArray; width: number; height: number };
    }): {
      Accumulator: {
        data: Float32Array;
        width: number;
        height: number;
        alpha_steps: number;
        r_steps: number;
      };
    } {
      // Clear accumulator
      accData.fill(0);
    
      for (let i = 0; i < YUVFrame.data.length; i += 4) {
        const maskValue = Mask.data[i / 4];
        const imgY = YUVFrame.data[i + 0];
    
        const x = (i / 4) % YUVFrame.width;
        const y = Math.floor(i / 4 / YUVFrame.width);
    
        // If a pixel is in the mask then it may be a line
        if (maskValue) {
          // Create its curve iterating for each possible angle
          for (let a = 0.0; a < Math.PI; a += a_step) {
            // Calculate the r parameter for that angle
            const r = x * Math.cos(a) + y * Math.sin(a);
    
            // If that parameter is between our bounds...
            if (r > -max_r && r < max_r) {
              // Calculate the destination cell of the accumulator
              const r_pos = Math.floor((r + max_r) / r_step);
              const a_pos = Math.floor(a / a_step);
    
              // And sum the luminance value to the accumulator
              accData[a_pos + r_pos * alpha_steps] += imgY;
            }
          }
        }
      }
    
      return {
        Accumulator: {
          data: accData,
          width: Mask.width,
          height: Mask.height,
          alpha_steps,
          r_steps,
        },
      };
    }`,
    inputs: [
      {
        label: 'YUVFrame',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
      {
        label: 'Mask',
        type: 'input' as const,
        valueType: 'mask' as const,
      },
    ],
    outputs: [
      {
        label: 'Accumulator',
        type: 'output' as const,
        valueType: 'accumulator' as const,
      },
    ],
  },

  {
    type: 'HoughMax',
    hardcoded: false,
    customInput: false,
    code: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;

    function HoughMax({
      Accumulator,
    }: {
      Accumulator: {
        data: Float32Array;
        width: number;
        height: number;
        alpha_steps: number;
        r_steps: number;
      };
    }): { A: number; R: number; A_Deg: number } {
      // Variables to store the maximum found so far
      let current_a = 0;
      let current_r = 0;
      let current_max = 0;
    
      // INSERT YOUR CODE HERE
    
      return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    solution: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;
    
    function HoughMax({
      Accumulator
    }: {
      Accumulator: {
        data: Float32Array;
        width: number;
        height: number;
        alpha_steps: number;
        r_steps: number;
      };
    }): { A: number; R: number; A_Deg: number } {
      // Variables to store the maximum found so far
      let current_a = 0;
      let current_r = 0;
      let current_max = 0;
    
      for (let r = 0; r < Accumulator.r_steps; r++) {
        for (let a = 0; a < Accumulator.alpha_steps; a++) {
          const value = Accumulator.data[a + r * Accumulator.alpha_steps];
    
          if (value > current_max) {
            current_max = value;
            current_a = a * a_step;
            current_r = r * r_step - max_r;
          }
        }
      }
    
      return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    inputs: [
      {
        label: 'Accumulator',
        type: 'input' as const,
        valueType: 'accumulator' as const,
      },
    ],
    outputs: [
      {
        label: 'A',
        type: 'output' as const,
        valueType: 'number' as const,
      },
      {
        label: 'R',
        type: 'output' as const,
        valueType: 'number' as const,
      },
      {
        label: 'A_Deg',
        type: 'output' as const,
        valueType: 'number' as const,
      },
    ],
  },

  {
    type: 'Ransac',
    hardcoded: false,
    customInput: false,
    code: `function Ransac({
      Mask,
    }: {
      Mask: { data: boolean[]; width: number; height: number };
    }):  { A: number; R: number; A_Deg: number }  {
      return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    solution: `function Ransac({
      Mask,
    }: {
      Mask: { data: boolean[]; width: number; height: number };
    }):  { A: number; R: number; A_Deg: number }  {
      return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    inputs: [
      {
        label: 'Mask',
        type: 'input' as const,
        valueType: 'mask' as const,
      },
    ],
    outputs: [
      {
        label: 'A',
        type: 'output' as const,
        valueType: 'number' as const,
      },
      {
        label: 'R',
        type: 'output' as const,
        valueType: 'number' as const,
      },
      {
        label: 'A_Deg',
        type: 'output' as const,
        valueType: 'number' as const,
      },
    ],
  },

  {
    type: 'DrawLine',
    hardcoded: false,
    customInput: false,
    code: `function DrawLine({
      Frame,
      A,
      R
    }: {
      Frame: ImageData;
      A: number;
      R: number;
    }): { Frame: ImageData } {
      const newData = new ImageData(Frame.width, Frame.height);
    
      for (let i = 0; i < Frame.data.length; i += 4) {
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        newData.data[i] = R;
        newData.data[i + 1] = G;
        newData.data[i + 2] = B;
        newData.data[i + 3] = 255;
      }
    
      A = -A - (90 * Math.PI) / 180;
    
      for (let x = 0; x < Frame.width; x++) {
        const px = (x * 2) / Frame.width - 1;
        const s = Frame.width / Math.cos(A);
        const py = px * Math.sin(A) * s;
    
        const y = Math.round(Frame.height / 2 - py / 2);
        const i = (x + y * Frame.width) * 4;
        newData.data[i] = 255;
        newData.data[i + 1] = 255;
        newData.data[i + 2] = 255;
      }
    
      return { Frame: newData };
    }`,
    solution: `function DrawLine({
      Frame,
      A,
      R
    }: {
      Frame: ImageData;
      A: number;
      R: number;
    }): { Frame: ImageData } {
      const newData = new ImageData(Frame.width, Frame.height);
    
      for (let i = 0; i < Frame.data.length; i += 4) {
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        newData.data[i] = R;
        newData.data[i + 1] = G;
        newData.data[i + 2] = B;
        newData.data[i + 3] = 255;
      }
    
      A = -A - (90 * Math.PI) / 180;
    
      for (let x = 0; x < Frame.width; x++) {
        const px = (x * 2) / Frame.width - 1;
        const s = Frame.width / Math.cos(A);
        const py = px * Math.sin(A) * s;
    
        const y = Math.round(Frame.height / 2 - py / 2);
        const i = (x + y * Frame.width) * 4;
        newData.data[i] = 255;
        newData.data[i + 1] = 255;
        newData.data[i + 2] = 255;
      }
    
      return { Frame: newData };
    }`,
    inputs: [
      {
        label: 'Frame',
        type: 'input' as const,
        valueType: 'imagedata' as const,
      },
      {
        label: 'A',
        type: 'input' as const,
        valueType: 'number' as const,
      },
      {
        label: 'R',
        type: 'input' as const,
        valueType: 'number' as const,
      },
    ],
    outputs: [
      {
        label: 'Frame',
        type: 'output' as const,
        valueType: 'imagedata' as const,
      },
    ],
  },
].map(template => ({
  ...template,
  code: formatCode(template.code),
  solution: formatCode(template.solution),
  fn: getFunctionFromCode(template.code),
}));
