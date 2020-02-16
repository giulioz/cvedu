import React, { useState, useRef, useCallback } from "react";
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

import { usePeriodicRerender } from "./utils";
import { formatCode, getFunctionFromCode } from "./codeUtils";
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
import CodeEditor from "./CodeEditor";
import CanvasOutput from "./CanvasOutput";

import "./globalStyles.css";
const theme = createMuiTheme({
  palette: { type: "dark" },
  overrides: { MuiAppBar: { root: { zIndex: null } } },
});

const useStyles = makeStyles(theme => ({
  full: {
    flexGrow: 1,
    height: "100%",
  },
  title: {
    flexGrow: 1,
  },
  firstContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  canvas: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
  logOutput: {
    flex: 1,
    width: "100%",
    overflow: "scroll",
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
    // flex: 1,
    // flexBasis: 0,
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

type BlockInfo = { code: string; fn: any };
type ValueType = "string" | "number" | "imagedata" | "mask";
type IOPortInfo = { valueType: ValueType };

const templatesInitial: BlockTemplate<BlockInfo, IOPortInfo>[] = [
  {
    type: "CameraInput",
    hardcoded: true,
    code: "",
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
    type: "DisplayFrame",
    hardcoded: true,
    code: "",
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
    code: `function RGBtoYUV({ Frame }: { Frame: ImageData }) {
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
    
      return { Frame: newData };
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
        label: "Frame",
        type: "output" as const,
        valueType: "imagedata" as const,
      },
    ],
  },
  {
    type: "ChromaKey",
    hardcoded: false,
    code: `const pU = 130;
    const pV = 162;
    const radius = 5;
    
    function ChromaKey({ YUVFrame }: { YUVFrame: ImageData }): { Mask: {data:boolean[];width:number;height:number} } {
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
].map(template => ({
  ...template,
  code: formatCode(template.code),
  fn: getFunctionFromCode(template.code),
}));

export default function App() {
  const classes = useStyles({});

  const [currentError, setCurrentError] = useState(null);
  function handleError(error: any) {
    if (String(error) !== currentError) {
      setCurrentError(String(error));
    }
  }
  function handleCloseError() {
    setCurrentError(null);
  }

  const [templates, setTemplates] = useState(templatesInitial);

  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [buildingBlockName, setBuildingBlockName] = useState("");
  function handleAdd() {
    setBuildingBlockName("");
    setAddBlockDialogOpen(true);
  }
  function handleCloseAddBlockDialog() {
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
  }

  const [blocks, setBlocks] = useState<Block<BlockInfo, IOPortInfo>[]>([]);
  const [links, setLinks] = useState<Link<IOPortInfo>[]>([]);

  const [selectedBlockID, setSelectedBlockID] = useState(null);
  const selectedBlock = blocks.find(b => b.uuid === selectedBlockID);
  const code = selectedBlock ? selectedBlock.code : "";

  function handleRun(code: string) {
    setBlocks(blocks =>
      blocks.map(b => {
        if (b.uuid === selectedBlockID) {
          const fn = getFunctionFromCode(code);

          return { ...b, code, fn };
        } else {
          return b;
        }
      })
    );
  }

  const tempResultsRef = useRef<{ [key: string]: { [key: string]: any } }>({});

  function handleFrame(imgData: ImageData): ImageData | null {
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

    const displayBlock = blocks.find(b => b.type === "DisplayFrame");
    if (displayBlock && tempResultsRef.current[displayBlock.uuid]) {
      return tempResultsRef.current[displayBlock.uuid]["Frame"];
    }

    return null;
  }

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
    [tempResultsRef]
  );

  // To allow deferred IO Decoration update
  usePeriodicRerender(100);

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppBar position="static">
          <Toolbar variant="dense">
            <Typography variant="h6" className={classes.title}>
              Block Editor
            </Typography>
          </Toolbar>
        </AppBar>

        <div className={classes.containerVert}>
          <div className={classes.containerHoriz}>
            <div className={classes.containerHorizHalfCanvas}>
              <CanvasOutput
                handler={handleFrame}
                onError={handleError}
                title="Output"
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
              links={links}
              setLinks={setLinks}
              templates={templates}
              onAdd={handleAdd}
              selectedBlock={selectedBlockID}
              onSelectBlock={setSelectedBlockID}
              renderIODecoration={renderIODecoration}
            />
          </div>
        </div>

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
      </ThemeProvider>
    </>
  );
}
