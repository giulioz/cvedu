import React, { useState, useEffect } from "react";
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

const initialCode = formatCode(`
// let i = 0;

function process(data: Uint8ClampedArray, width: number, height: number) {
  for (let i = 0; i < data.length; i += 4) {
    const rnd = Math.random() * 255;
    data[i + 1] = data[i] * 0.5 + rnd * 0.5;
    data[i + 2] = data[i + 1] * 0.5 + rnd * 0.5;
    data[i + 3] = 255;
  }

  // log(i);
  // i++;
}`);

type Handler = (
  data: Uint8ClampedArray,
  width: number,
  height: number
) => Uint8ClampedArray | void;

const templates: BlockTemplate[] = [
  {
    type: "Camera Input",
    hardcoded: true,
    code: "test1",
    inputs: [],
    outputs: [{ label: "Frame" }],
  },
  {
    type: "Chroma Key",
    hardcoded: false,
    code: "test2",
    inputs: [
      { label: "Frame" },
      { label: "U" },
      { label: "V" },
      { label: "Radius" },
    ],
    outputs: [{ label: "Mask" }],
  },
  {
    type: "Hough Transf",
    hardcoded: false,
    code: "",
    inputs: [{ label: "Mask" }],
    outputs: [{ label: "Angle" }, { label: "Distance" }],
  },
  {
    type: "RANSAC",
    hardcoded: false,
    code: "",
    inputs: [{ label: "Mask" }],
    outputs: [{ label: "Angle" }, { label: "Distance" }],
  },
  {
    type: "Display Frame",
    hardcoded: true,
    code: "",
    inputs: [{ label: "Frame" }],
    outputs: [],
  },
  {
    type: "Draw Line",
    hardcoded: false,
    code: "",
    inputs: [{ label: "Frame" }, { label: "Angle" }, { label: "Distance" }],
    outputs: [{ label: "Frame" }],
  },
  {
    type: "RGB to YUV",
    hardcoded: false,
    code: "",
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

  const [handler, setHandler] = useState<Handler>(() =>
    getFunctionFromCode<Handler>(initialCode)
  );
  function handleRun(code: string) {
    setCurrentError("");

    try {
      const F = getFunctionFromCode<Handler>(code);
      // WARNING: we are dealing with functions, this messes with React state setters
      setHandler(() => F);
    } catch (e) {
      setCurrentError(String(e));
    }
  }

  const [currentError, setCurrentError] = useState(null);
  function handleError(error: any) {
    if (String(error) !== currentError) {
      setCurrentError(String(error));
    }

    setHandler(() => () => {});
  }
  function handleCloseError() {
    setCurrentError(null);
  }

  const [addBlockDialogOpen, setAddBlockDialogOpen] = useState(false);
  const [buildingBlockName, setBuildingBlockName] = useState("");
  function handleAdd() {
    setBuildingBlockName("");
    setAddBlockDialogOpen(true);
  }
  function handleCloseAddBlockDialog() {
    setAddBlockDialogOpen(false);
  }

  const [blocks, setBlocks] = useState([]);
  const [links, setLinks] = useState([]);

  const [selectedBlockID, setSelectedBlockID] = useState(null);
  const selectedBlock = blocks.find(b => b.uuid === selectedBlockID);
  const code = selectedBlock ? selectedBlock.code : "";

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
                handler={handler}
                onError={handleError}
                title="Output for test"
              />
            </div>
            <div className={classes.containerHorizHalf}>
              <CodeEditor
                // initialCode={initialCode}
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
