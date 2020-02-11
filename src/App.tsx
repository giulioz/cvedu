import React, { useState } from "react";
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

import CodeEditor from "./CodeEditor";
import { formatCode, getFunctionFromCode } from "./codeUtils";
import BlockEditor, { BlockTemplate } from "./BlockEditor";
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

const templatesInitial: BlockTemplate[] = [
  {
    type: "CameraInput",
    hardcoded: true,
    code: "",
    inputs: [],
    outputs: [{ label: "Frame" }],
  },
  {
    type: "DisplayFrame",
    hardcoded: true,
    code: "",
    inputs: [{ label: "Frame" }],
    outputs: [],
  },
  {
    type: "Process",
    hardcoded: false,
    code: `function Process({ Frame }: { Frame: ImageData }) {
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
        Frame.data[i] = Y;
        Frame.data[i + 1] = U;
        Frame.data[i + 2] = V;
      }
    
      return { Frame };
    }
    `,
    inputs: [{ label: "Frame" }],
    outputs: [{ label: "Frame" }],
  },
].map(template => ({
  ...template,
  inputs: template.inputs.map(i => ({
    ...i,
    uuid: `${template.type}-${i.label}-input`,
  })),
  outputs: template.outputs.map(i => ({
    ...i,
    uuid: `${template.type}-${i.label}-output`,
  })),
}));

export default function App() {
  const classes = useStyles({});

  const [currentError, setCurrentError] = useState(null);
  function handleError(error: any) {
    if (String(error) !== currentError) {
      setCurrentError(String(error));
    }

    // setHandler(() => () => {});
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
    setTemplates(t => [
      ...t,
      {
        type: buildingBlockName,
        hardcoded: false,
        code: `function ${buildingBlockName}(input) {}`,
        inputs: [{ label: "Input", uuid: `${buildingBlockName}-Input-input` }],
        outputs: [
          { label: "Output", uuid: `${buildingBlockName}-Output-output` },
        ],
      },
    ]);
    setAddBlockDialogOpen(false);
  }

  const [blocks, setBlocks] = useState([]);
  const [links, setLinks] = useState([]);

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

  function handleFrame(imgData: ImageData) {
    const endNode = blocks.find(b => b.type === "DisplayFrame");

    function recurse(node) {
      if (!node || (!node.hardcoded && !node.fn)) return null;

      const inLinks = links.filter(l => l.uuidEnd.startsWith(node.uuid + "-"));
      const inBlocks = inLinks.map(l =>
        blocks.find(b => b.uuid === l.uuidStart.split("-")[0])
      );

      const resultsChild = inBlocks.map(b => ({
        uuid: b.uuid,
        params: recurse(b),
      }));

      if (node.type === "DisplayFrame") {
        const onlyResult = resultsChild[0];
        if (onlyResult && onlyResult.params.Frame) {
          return onlyResult.params.Frame;
        } else {
          return null;
        }
      } else if (node.type === "CameraInput") {
        return { Frame: imgData };
      } else {
        const params = {};
        inLinks.forEach(({ uuidStart, uuidEnd }) => {
          const [srcUuid, srcBlockType, srcInputName] = uuidStart.split("-");
          const [destUuid, destBlockType, destInputName] = uuidEnd.split("-");
          params[destInputName] = resultsChild.find(
            c => c.uuid === srcUuid
          ).params[srcInputName];
        });
        return node.fn(params);
      }
    }

    return recurse(endNode);
  }

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
                // initialCode={initialCode}
                // onRun={handleRun}
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
