import React from "react";

import { BlockInfo, IOPortInfo } from "./App";
import { formatCode, getFunctionFromCode } from "./codeUtils";
import { NumberInputHelper, UVInputHelper } from "./InputHelpers";
import { Block, BlockTemplate } from "./BlockEditor";

export const templatesInitial: BlockTemplate<BlockInfo, IOPortInfo>[] = [
  {
    type: "CameraInput",
    hardcoded: true,
    customInput: false,
    code: "",
    solution: "",
    color: "#422828",
    inputs: [],
    outputs: [
      {
        label: "Frame",
        type: "output" as const,
        valueType: "imagedata" as const,
      },
    ],
  },

  {
    type: "NumericInput",
    hardcoded: true,
    customInput: true,
    code: "",
    solution: "",
    color: "#423f28",
    customRenderer: (
      block: Block<BlockInfo, IOPortInfo>,
      {
        customValues,
        setCustomValues,
      }: {
        customValues: { [key: string]: any };
        setCustomValues: (
          fn: (old: { [key: string]: any }) => { [key: string]: any }
        ) => void;
      }
    ) => (
      <NumberInputHelper
        customValues={customValues}
        setCustomValues={setCustomValues}
        block={block}
        minValue={0}
        maxValue={30}
        step={0.01}
      />
    ),
    inputs: [],
    outputs: [
      {
        label: "Number",
        type: "output" as const,
        valueType: "number" as const,
      },
    ],
  },

  {
    type: "UVInput",
    hardcoded: true,
    customInput: true,
    code: "",
    solution: "",
    color: "#423f28",
    customRenderer: (
      block: Block<BlockInfo, IOPortInfo>,
      {
        customValues,
        setCustomValues,
      }: {
        customValues: { [key: string]: any };
        setCustomValues: (
          fn: (old: { [key: string]: any }) => { [key: string]: any }
        ) => void;
      }
    ) => (
      <UVInputHelper
        customValues={customValues}
        setCustomValues={setCustomValues}
        block={block}
      />
    ),
    inputs: [],
    outputs: [
      {
        label: "U",
        type: "output" as const,
        valueType: "number" as const,
      },
      {
        label: "V",
        type: "output" as const,
        valueType: "number" as const,
      },
    ],
  },

  {
    type: "DisplayFrame",
    hardcoded: true,
    customInput: false,
    code: "",
    solution: "",
    color: "#284042",
    inputs: [
      {
        label: "Frame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
    ],
    outputs: [],
  },

  {
    type: "RandomNumber",
    hardcoded: false,
    customInput: false,
    code:
      "function RandomNumber():{Number:number}{return {Number:Math.random()}}",
    solution:
      "function RandomNumber():{Number:number}{return {Number:Math.random()}}",
    inputs: [],
    outputs: [
      {
        label: "Number",
        type: "output" as const,
        valueType: "number" as const,
      },
    ],
  },

  {
    type: "Lightness",
    hardcoded: false,
    customInput: false,
    code: `function Lightness({
      Amount,
      Frame
    }: {
      Amount: number;
      Frame: ImageData;
    }): { Frame: ImageData } {
      // Copia i pixel dell'immagine
      const newData = new ImageData(Frame.width, Frame.height);
    
      // Per ogni pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        newData.data[i] = R * Amount;
        newData.data[i + 1] = G * Amount;
        newData.data[i + 2] = B * Amount;
        newData.data[i + 3] = 255;
      }
    
      return { Frame: newData };
    }`,
    solution: `function Lightness({
      Amount,
      Frame
    }: {
      Amount: number;
      Frame: ImageData;
    }): { Frame: ImageData } {
      // Copia i pixel dell'immagine
      const newData = new ImageData(Frame.width, Frame.height);
    
      // Per ogni pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        newData.data[i] = R * Amount;
        newData.data[i + 1] = G * Amount;
        newData.data[i + 2] = B * Amount;
        newData.data[i + 3] = 255;
      }
    
      return { Frame: newData };
    }`,
    inputs: [
      {
        label: "Amount",
        type: "input" as const,
        valueType: "number" as const,
      },
      {
        label: "Frame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
    ],
    outputs: [
      {
        label: "Frame",
        type: "output" as const,
        valueType: "imagedata" as const,
      },
    ],
  },

  {
    type: "RGBtoYUV",
    hardcoded: false,
    customInput: false,
    code: `function RGBtoYUV({ Frame }: { Frame: ImageData }):{ YUVFrame: ImageData } {
      // Copia i pixel dell'immagine
      const newData = new ImageData(Frame.width, Frame.height);
    
      // Per ogni pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        // Estrae i valori di RGB
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        // Calcola i valori di YUV applicando una moltiplicazione matriciale
        const Y = 0.257 * R + 0.504 * G + 0.098 * B + 16;
        const U = -0.148 * R - 0.291 * G + 0.439 * B + 128;
        const V = 0.439 * R - 0.368 * G - 0.071 * B + 128;
    
        // Salva i valori di YUV sulla copia dell'immagine
        newData.data[i] = Y;
        newData.data[i + 1] = U;
        newData.data[i + 2] = V;
        newData.data[i + 3] = 255;
      }
    
      return { YUVFrame: newData };
    }`,
    solution: `function RGBtoYUV({ Frame }: { Frame: ImageData }):{ YUVFrame: ImageData } {
      // Copia i pixel dell'immagine
      const newData = new ImageData(Frame.width, Frame.height);
    
      // Per ogni pixel...
      for (let i = 0; i < Frame.data.length; i += 4) {
        // Estrae i valori di RGB
        const R = Frame.data[i];
        const G = Frame.data[i + 1];
        const B = Frame.data[i + 2];
    
        // Calcola i valori di YUV applicando una moltiplicazione matriciale
        const Y = 0.257 * R + 0.504 * G + 0.098 * B + 16;
        const U = -0.148 * R - 0.291 * G + 0.439 * B + 128;
        const V = 0.439 * R - 0.368 * G - 0.071 * B + 128;
    
        // Salva i valori di YUV sulla copia dell'immagine
        newData.data[i] = Y;
        newData.data[i + 1] = U;
        newData.data[i + 2] = V;
        newData.data[i + 3] = 255;
      }
    
      return { YUVFrame: newData };
    }`,
    inputs: [
      {
        label: "Frame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
    ],
    outputs: [
      {
        label: "YUVFrame",
        type: "output" as const,
        valueType: "imagedata" as const,
      },
    ],
  },

  {
    type: "ChromaKeyUV",
    hardcoded: false,
    customInput: false,
    code: `function ChromaKeyUV({ YUVFrame, pU,pV,radius }: { YUVFrame: ImageData;pU:number;pV:number;radius:number }): { Mask: {data:boolean[];width:number;height:number} } {
      // Crea una maschera vuota
      const data = new Array<boolean>(YUVFrame.width * YUVFrame.height).fill(false);

      // COMPLETA QUI

      return { Mask:{data,width:YUVFrame.width,height:YUVFrame.height} };
    }`,
    solution: `function ChromaKeyUV({ YUVFrame, pU,pV,radius }: { YUVFrame: ImageData;pU:number;pV:number;radius:number }): { Mask: {data:boolean[];width:number;height:number} } {
      // Crea una maschera vuota
      const data = new Array<boolean>(YUVFrame.width * YUVFrame.height).fill(false);
    
      for (let i = 0; i < YUVFrame.data.length; i += 4) {
        // Estraggo i valori di U e V per quel pixel
        const U = YUVFrame.data[i + 1];
        const V = YUVFrame.data[i + 2];
    
        // Calcolo la distanza fra il pixel e i valori di u e v desiderati
        const du = U - pU;
        const dv = V - pV;
    
        // Ne faccio la somma dei quadrati
        const d2 = du * du + dv * dv;
    
        // E calcolo il quadrato del raggio
        const r2 = radius * radius;
    
        // Se la somma dei quadrati è inferiore al quadrato del raggio il pixel è valido
        data[i / 4] = d2 < r2;
      }
    
      return { Mask:{data,width:YUVFrame.width,height:YUVFrame.height} };
    }`,
    inputs: [
      {
        label: "YUVFrame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
      {
        label: "pU",
        type: "input" as const,
        valueType: "number" as const,
      },
      {
        label: "pV",
        type: "input" as const,
        valueType: "number" as const,
      },
      {
        label: "radius",
        type: "input" as const,
        valueType: "number" as const,
      },
    ],
    outputs: [
      {
        label: "Mask",
        type: "output" as const,
        valueType: "mask" as const,
      },
    ],
  },

  {
    type: "Hough",
    hardcoded: false,
    customInput: false,
    code: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;
    
    function Hough({ YUVFrame, Mask }: { YUVFrame: ImageData;Mask: {data:boolean[];width:number;height:number} }): { A:number;R:number;A_Deg:number } {
      // Accumulatore
  const alpha_steps = Math.round(Math.PI / a_step) + 1;
  const r_steps = Math.round((max_r * 2.0) / r_step) + 1;
  const accumulator = new Array(alpha_steps * r_steps).fill(0);

  // Variabili per immagazzinare i massimi trovati
  let current_a = 0;
  let current_r = 0;
  let current_max = 0;

  for (let i = 0; i < YUVFrame.data.length; i += 4) {
    const maskValue = Mask.data[i / 4];
    const imgY = YUVFrame.data[i + 0];

    const x = (i / 4) % YUVFrame.width;
    const y = Math.floor(i / 4 / YUVFrame.width);

    // COMPLETA QUI

  }

  return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    solution: `const a_step = 0.1;
    const r_step = 4.0;
    const max_r = 400.0;
    
    function Hough({ YUVFrame, Mask }: { YUVFrame: ImageData;Mask: {data:boolean[];width:number;height:number} }): { A:number;R:number;A_Deg:number } {
      // Accumulatore
  const alpha_steps = Math.round(Math.PI / a_step) + 1;
  const r_steps = Math.round((max_r * 2.0) / r_step) + 1;
  const accumulator = new Array(alpha_steps * r_steps).fill(0);

  // Variabili per immagazzinare i massimi trovati
  let current_a = 0;
  let current_r = 0;
  let current_max = 0;

  for (let i = 0; i < YUVFrame.data.length; i += 4) {
    const maskValue = Mask.data[i / 4];
    const imgY = YUVFrame.data[i + 0];

    const x = (i / 4) % YUVFrame.width;
    const y = Math.floor(i / 4 / YUVFrame.width);

    // Se un pixel è stato selezionato dalla maschera può far parte della barra
    if (maskValue) {
      // Creo la sua curva trasformata iterando per ogni angolo
      for (let a = 0.0; a < Math.PI; a += a_step) {
        // Calcolo il parametro r per tale angolo
        const r = x * Math.cos(a) + y * Math.sin(a);

        // Se tale parametro è compreso nei bound attesi...
        if (r > -max_r && r < max_r) {
          // Calcolo la cella nell'accumulatore
          const r_pos = Math.round((r + max_r) / r_step);
          const a_pos = Math.round(a / a_step);

          // E vi aggiungo il valore della luminanza
          accumulator[a_pos + r_pos * alpha_steps] += imgY;

          // Controllo se il valore ottenuto è superiore al massimo attuale
          if (accumulator[a_pos + r_pos * alpha_steps] > current_max) {
            current_max = accumulator[a_pos + r_pos * alpha_steps];
            current_a = a;
            current_r = r;
          }
        }
      }
    }
  }

  return { A: current_a, R: current_r, A_Deg: current_a * (180.0 / Math.PI) };
    }`,
    inputs: [
      {
        label: "YUVFrame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
      {
        label: "Mask",
        type: "input" as const,
        valueType: "mask" as const,
      },
    ],
    outputs: [
      {
        label: "A",
        type: "output" as const,
        valueType: "number" as const,
      },
      {
        label: "R",
        type: "output" as const,
        valueType: "number" as const,
      },
      {
        label: "A_Deg",
        type: "output" as const,
        valueType: "number" as const,
      },
    ],
  },

  {
    type: "DrawLine",
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
        label: "Frame",
        type: "input" as const,
        valueType: "imagedata" as const,
      },
      {
        label: "A",
        type: "input" as const,
        valueType: "number" as const,
      },
      {
        label: "R",
        type: "input" as const,
        valueType: "number" as const,
      },
    ],
    outputs: [
      {
        label: "Frame",
        type: "output" as const,
        valueType: "imagedata" as const,
      },
    ],
  },
].map(template => ({
  ...template,
  code: formatCode(template.code),
  solution: formatCode(template.solution),
  fn: getFunctionFromCode(template.code),
}));
