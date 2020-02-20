import React, { useState, useRef, useCallback, useMemo } from "react";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import {
  Dialog,
  DialogActions,
  TextField,
  DialogContent,
  DialogTitle,
  Button,
} from "@material-ui/core";
import { useAutoMemo, useAutoCallback } from "hooks.macro";

import { usePeriodicRerender, usePersistState } from "./utils";
import { formatCode, getFunctionFromCode } from "./codeUtils";
import { maskToImageData } from "./videoUtils";
import BlockEditor, {
  BlockTemplate,
  Block,
  Link,
  IOPortInst,
} from "./BlockEditor";
import {
  NumberIOHelper,
  StringIOHelper,
  ImageIOHelper,
  MaskIOHelper,
} from "./IOPortsHelpers";
import { NumberInputHelper, UVInputHelper } from "./InputHelpers";
import CodeEditor from "./CodeEditor";
import CanvasOutput from "./CanvasOutput";

import "./globalStyles.css";

const theme = createMuiTheme({
  palette: { type: "dark" },
  overrides: { MuiAppBar: { root: { zIndex: null } } },
});

const useStyles = makeStyles(theme => ({
  title: {
    flexGrow: 1,
  },
  containerVert: {
    width: "100%",
    height: "100%",
  },
  containerHoriz: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    width: "100%",
    height: "50%",
    display: "flex",
    flexDirection: "row",
  },
  containerHorizHalf: {
    flex: 1,
    flexBasis: 0,
  },
  containerHorizHalfCanvas: {
    flex: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

type BlockInfo = { code: string; fn: any; customInput: boolean };
type ValueType = "string" | "number" | "imagedata" | "mask";
type IOPortInfo = { valueType: ValueType };

const templatesInitial: BlockTemplate<BlockInfo, IOPortInfo>[] = [
  {
    type: "CameraInput",
    hardcoded: true,
    customInput: false,
    code: "",
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
  fn: getFunctionFromCode(template.code),
}));

export default function App() {
  const classes = useStyles({});

  const [currentError, setCurrentError] = useState(null);
  const handleError = useAutoCallback(function handleError(error: any) {
    if (String(error) !== currentError) {
      setCurrentError(String(error));
    }
  });
  function handleCloseError() {
    setCurrentError(null);
  }

  const [templates, setTemplates] = useState(templatesInitial);

  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [buildingBlockName, setBuildingBlockName] = useState("");
  const handleAdd = useCallback(() => {
    setBuildingBlockName("");
    setAddBlockDialogOpen(true);
  }, []);
  const handleCloseAddBlockDialog = useCallback(() => {
    // setTemplates(t => [
    //   ...t,
    //   {
    //     type: buildingBlockName,
    //     hardcoded: false,
    //     code: formatCode(`function ${buildingBlockName}({Input}) {return {}}`),
    //     inputs: [{ label: "Input", uuid: `${buildingBlockName}-Input-input` }],
    //     outputs: [
    //       { label: "Output", uuid: `${buildingBlockName}-Output-output` },
    //     ],
    //   },
    // ]);
    // setAddBlockDialogOpen(false);
  }, []);

  const [blocks, setBlocks] = useState<Block<BlockInfo, IOPortInfo>[]>([]);
  const reHydrateBlocks = useCallback(
    (blocks: Block<BlockInfo, IOPortInfo>[]) => {
      const nBlocks = blocks.map(b => ({
        ...templates.find(t => t.type === b.type),
        ...b,
        inputs: b.inputs,
        outputs: b.outputs,
        fn: getFunctionFromCode(b.code),
      }));
      setBlocks(nBlocks);
    },
    [templates]
  );
  usePersistState(blocks, reHydrateBlocks, "blocks");

  const [blocksPos, setBlocksPos] = useState<
    { uuid: string; x: number; y: number }[]
  >([]);
  usePersistState(blocksPos, setBlocksPos, "blocksPos");

  const [links, setLinks] = useState<Link<IOPortInfo>[]>([]);
  usePersistState(links, setLinks, "links");

  const [customValues, setCustomValues] = useState({});
  usePersistState(customValues, setCustomValues, "customValues");

  const handleClearAll = useAutoCallback(() => {
    setBlocks([]);
    setBlocksPos([]);
    setLinks([]);
    setCustomValues({});
  });

  const [selectedBlockID, setSelectedBlockID] = useState(null);
  const selectedBlock = blocks.find(b => b.uuid === selectedBlockID);
  const code = selectedBlock ? selectedBlock.code : "";

  const handleRun = useAutoCallback((code: string) => {
    setBlocks(blocks =>
      blocks.map(b => {
        if (b.uuid === selectedBlockID) {
          try {
            const fn = getFunctionFromCode(code);
            return { ...b, code, fn };
          } catch (e) {
            setCurrentError(String(e));
          }

          return b;
        } else {
          return b;
        }
      })
    );
  });

  const tempResultsRef = useRef<{ [key: string]: { [key: string]: any } }>({});

  const { frameOutputName, blockToDisplay } = useAutoMemo(() => {
    const blockToDisplay = blocks.find(b => b.uuid === selectedBlockID);
    const frameOutputName =
      blockToDisplay &&
      blockToDisplay.outputs.find(
        o => o.valueType === "imagedata" || o.valueType === "mask"
      );
    return { frameOutputName, blockToDisplay };
  });

  const handleFrame = useAutoCallback(function handleFrame(
    imgData: ImageData
  ): ImageData | null {
    if (currentError) return null;

    tempResultsRef.current = {};

    function getNodeParams(b: Block<BlockInfo, IOPortInfo>) {
      if (!b) return false;

      const params = {};
      b.inputs.forEach(i => (params[i.label] = null));

      const inLinks = links.filter(l => l.dst && b.uuid === l.dst.blockUuid);
      inLinks.forEach(({ src, dst }) => {
        if (
          tempResultsRef.current[src.blockUuid] &&
          tempResultsRef.current[src.blockUuid][src.label] !== null
        ) {
          params[dst.label] = tempResultsRef.current[src.blockUuid][src.label];
        }
      });

      if (b.inputs.every(i => params[i.label] !== null)) {
        return params;
      } else {
        return false;
      }
    }

    const startNodes = blocks.filter(b => b.inputs.length === 0);
    const queue = startNodes.map(b => ({ block: b, params: {} }));
    while (queue.length > 0) {
      const { block, params } = queue.shift();

      if (block.hardcoded || block.fn) {
        if (block.type === "CameraInput") {
          tempResultsRef.current[block.uuid] = { Frame: imgData };
        } else if (block.customInput) {
          tempResultsRef.current[block.uuid] = {
            ...customValues[block.uuid],
          };
        } else if (block.type === "DisplayFrame") {
          tempResultsRef.current[block.uuid] = { Frame: params["Frame"] };
        } else if (params && !block.hardcoded) {
          tempResultsRef.current[block.uuid] = block.fn(params);
        }

        if (params) {
          const outLinks = links.filter(
            l => l.src && l.src.blockUuid === block.uuid
          );

          const outBlocks = [
            ...new Set(
              outLinks.map(l => l.dst && l.dst.blockUuid).filter(uuid => uuid)
            ),
          ].map(uuid => blocks.find(b => b.uuid === uuid));

          const outBlocksWithParams = outBlocks
            .map(b => ({
              block: b,
              params: getNodeParams(b),
            }))
            .filter(b => b.params);

          outBlocksWithParams.forEach(b => queue.push(b));
        }
      }
    }

    if (frameOutputName && tempResultsRef.current[blockToDisplay.uuid]) {
      if (frameOutputName.valueType === "imagedata") {
        return tempResultsRef.current[blockToDisplay.uuid][
          frameOutputName.label
        ];
      }

      if (frameOutputName.valueType === "mask") {
        return maskToImageData(
          tempResultsRef.current[blockToDisplay.uuid][frameOutputName.label]
        );
      }
    }

    const displayBlock = blocks.find(b => b.type === "DisplayFrame");
    if (displayBlock && tempResultsRef.current[displayBlock.uuid]) {
      return tempResultsRef.current[displayBlock.uuid]["Frame"];
    }

    return null;
  });

  // To allow deferred IO Decoration update
  const updateIndex = usePeriodicRerender(100);

  const renderIODecoration = useCallback(
    (port: IOPortInst<IOPortInfo>) => {
      const value =
        tempResultsRef.current[port.blockUuid] &&
        tempResultsRef.current[port.blockUuid][port.label];

      if (port.type === "output" && value !== null && value !== undefined) {
        switch (port.valueType) {
          case "number":
            return <NumberIOHelper value={value} />;
          case "string":
            return <StringIOHelper value={value} />;
          case "imagedata":
            return <ImageIOHelper value={value} />;
          case "mask":
            return <MaskIOHelper value={value} />;

          default:
            return null;
        }
      } else {
        return null;
      }
    },
    [tempResultsRef, updateIndex]
  );

  const customRendererParams = useAutoMemo(() => ({
    customValues,
    setCustomValues,
  }));

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        {useAutoMemo(() => (
          <AppBar position="static">
            <Toolbar variant="dense">
              <Typography variant="h6" className={classes.title}>
                Block Editor
              </Typography>
              <Button onClick={handleClearAll}>Clear All</Button>
            </Toolbar>
          </AppBar>
        ))}

        <div className={classes.containerVert}>
          <div className={classes.containerHoriz}>
            <div className={classes.containerHorizHalfCanvas}>
              <CanvasOutput
                handler={handleFrame}
                onError={handleError}
                title={
                  blockToDisplay && frameOutputName
                    ? `Output for ${blockToDisplay.type}`
                    : "Output"
                }
              />
            </div>
            <div className={classes.containerHorizHalf}>
              <CodeEditor
                initialCode={code}
                onRun={handleRun}
                onError={handleError}
              />
            </div>
          </div>
          <div className={classes.containerHoriz}>
            <BlockEditor
              blocks={blocks}
              setBlocks={setBlocks}
              blocksPos={blocksPos}
              setBlocksPos={setBlocksPos}
              links={links}
              setLinks={setLinks}
              templates={templates}
              onAdd={handleAdd}
              selectedBlock={selectedBlockID}
              onSelectBlock={setSelectedBlockID}
              renderIODecoration={renderIODecoration}
              customParams={customRendererParams}
            />
          </div>
        </div>

        {useAutoMemo(() => (
          <Snackbar
            open={Boolean(currentError)}
            autoHideDuration={6000}
            onClose={handleCloseError}
          >
            <Alert
              severity="error"
              elevation={6}
              variant="filled"
              onClose={handleCloseError}
            >
              <AlertTitle>Error:</AlertTitle>
              <pre>{currentError}</pre>
            </Alert>
          </Snackbar>
        ))}

        {useAutoMemo(() => (
          <Dialog open={addBlockDialogOpen} onClose={handleCloseAddBlockDialog}>
            <DialogTitle>Add a new Block</DialogTitle>
            <DialogContent>
              <TextField
                value={buildingBlockName}
                onChange={e => setBuildingBlockName(e.target.value)}
                label="Name"
                margin="dense"
                variant="outlined"
                autoFocus
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseAddBlockDialog}
                variant="contained"
                color="primary"
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
        ))}
      </ThemeProvider>
    </>
  );
}
