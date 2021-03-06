import React, { useState, useRef, useCallback } from "react";
import { useAutoMemo, useAutoCallback, useAutoEffect } from "hooks.macro";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import { createMuiTheme, makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import blue from "@material-ui/core/colors/blue";
import pink from "@material-ui/core/colors/pink";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Snackbar from "@material-ui/core/Snackbar";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import { DiGithubBadge } from "react-icons/di";

import { templatesInitial } from "./templates";
import { usePeriodicRerender, usePersistState } from "./utils";
import { getFunctionFromCode } from "./codeUtils";
import { maskToImageData, accumulatorToImageData } from "./videoUtils";
import BlockEditor, { Block, Link, IOPortInst } from "./BlockEditor";
import {
  NumberIOHelper,
  StringIOHelper,
  ImageIOHelper,
  MaskIOHelper,
} from "./IOPortsHelpers";
import { InputDialog } from "./dialogs";
import CodeEditor from "./CodeEditor";
import CanvasOutput from "./CanvasOutput";
import Game from "./Game";

import "./globalStyles.css";

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#e53935",
    },
    // primary: blue,
    secondary: blue,
  },
  overrides: { MuiAppBar: { root: { zIndex: null } } },
});

const useStyles = makeStyles(theme => ({
  title: {
    flexGrow: 1,
  },
  topButton: {
    margin: theme.spacing(1),
  },
  containerVert: {
    width: "100%",
    height: "calc(100% - 52px)",
  },
  containerHoriz: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    width: "100%",
    height: "60%",
    display: "flex",
    flexDirection: "row",
  },
  containerHorizSM: {
    width: "100%",
    height: "40%",
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

export type BlockInfo = {
  code: string;
  solution: string;
  solutionPassword: string;
  fn: any;
  customInput: boolean;
};
export type ValueType =
  | "string"
  | "number"
  | "imagedata"
  | "mask"
  | "accumulator";
export type IOPortInfo = { valueType: ValueType };

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
  const handleOpenAddBlockDialog = useCallback(
    () => setAddBlockDialogOpen(true),
    [setAddBlockDialogOpen]
  );
  const handleAbortAddBlockDialog = useCallback(
    () => setAddBlockDialogOpen(false),
    [setAddBlockDialogOpen]
  );
  const handleAddBlock = useCallback(() => {
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

  const [links, setLinks] = useState<(Link<IOPortInfo> | false)[]>([]);
  usePersistState(links, setLinks, "links");
  useAutoEffect(() => {
    if (!links.every(l => l !== false)) {
      setCurrentError("Incompatible Types");
    }
  });
  const validLinks: Link<IOPortInfo>[] = useAutoMemo(
    () => links.filter(l => l !== false) as Link<IOPortInfo>[]
  );

  const handleUpdateLinks = useAutoCallback(
    (fn: (prev: Link<IOPortInfo>[]) => Link<IOPortInfo>[]) => {
      function linkValid(link: Link<IOPortInfo>) {
        if (!link.dst || !link.src.valueType) {
          return true;
        } else if (link.src.valueType !== link.dst.valueType) {
          return false;
        } else {
          return true;
        }
      }

      setLinks(old => {
        const newLinks = fn(old.filter(l => l !== false) as Link<IOPortInfo>[]);
        return newLinks.map(l => (linkValid(l) ? l : false));
      });
    }
  );

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

  const handleReset = useAutoCallback(() => {
    setBlocks(blocks =>
      blocks.map(b => {
        if (b.uuid === selectedBlockID) {
          try {
            const code = templates.find(t => t.type === b.type).code;
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

  const [solutionPasswordDialogOpen, setSolutionPasswordDialogOpen] = useState(
    false
  );
  const handleOpenSolutionPasswordDialog = useCallback(
    () => setSolutionPasswordDialogOpen(true),
    [setSolutionPasswordDialogOpen]
  );
  const handleAbortSolutionPasswordDialog = useCallback(
    () => setSolutionPasswordDialogOpen(false),
    [setSolutionPasswordDialogOpen]
  );
  const handleSolution = useAutoCallback((password: string) => {
    if (
      password === blocks.find(b => b.uuid === selectedBlockID).solutionPassword
    ) {
      setBlocks(blocks =>
        blocks.map(b => {
          if (b.uuid === selectedBlockID) {
            try {
              const code = templates.find(t => t.type === b.type).solution;
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
    }

    setSolutionPasswordDialogOpen(false);
  });

  const tempResultsRef = useRef<{ [key: string]: { [key: string]: any } }>({});

  const [currentGameLane, setCurrentGameLane] = useState(0);

  const { frameOutputName, blockToDisplay } = useAutoMemo(() => {
    const blockToDisplay = blocks.find(b => b.uuid === selectedBlockID);
    const frameOutputName =
      blockToDisplay &&
      blockToDisplay.outputs.find(
        o =>
          o.valueType === "imagedata" ||
          o.valueType === "mask" ||
          o.valueType === "accumulator"
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

      const inLinks = validLinks.filter(
        l => l.dst && b.uuid === l.dst.blockUuid
      );
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
        } else if (block.type === "Game") {
          tempResultsRef.current[block.uuid] = { Angle: params["Angle"] };
        } else if (params && !block.hardcoded) {
          tempResultsRef.current[block.uuid] = block.fn(params);
        }

        if (params) {
          const outLinks = validLinks.filter(
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

      if (frameOutputName.valueType === "accumulator") {
        return accumulatorToImageData(
          tempResultsRef.current[blockToDisplay.uuid][frameOutputName.label]
        );
      }
    }

    const gameBlock = blocks.find(b => b.type === "Game");
    if (gameBlock && tempResultsRef.current[gameBlock.uuid]) {
      const lane =
        -(tempResultsRef.current[gameBlock.uuid]["Angle"] - 1.6) * 1.5;
      setCurrentGameLane(lane);
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
              <Button
                startIcon={<DeleteForeverIcon />}
                onClick={handleClearAll}
                variant="outlined"
                className={classes.topButton}
              >
                Clear All
              </Button>
              <Button
                startIcon={<DiGithubBadge />}
                variant="outlined"
                component="a"
                href="http://www.github.com/giulioz/cvedu"
                className={classes.topButton}
              >
                About
              </Button>
            </Toolbar>
          </AppBar>
        ))}

        <div className={classes.containerVert}>
          <div className={classes.containerHoriz}>
            <div className={classes.containerHorizHalfCanvas}>
              {blockToDisplay && blockToDisplay.type === "Game" && (
                <Game currentLane={currentGameLane} />
              )}

              <CanvasOutput
                style={{
                  display:
                    blockToDisplay && blockToDisplay.type === "Game"
                      ? "none"
                      : undefined,
                }}
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
                onReset={handleReset}
                onSolution={handleOpenSolutionPasswordDialog}
                onError={handleError}
              />
            </div>
          </div>
          <div className={classes.containerHorizSM}>
            <BlockEditor
              blocks={blocks}
              setBlocks={setBlocks}
              blocksPos={blocksPos}
              setBlocksPos={setBlocksPos}
              links={validLinks}
              setLinks={handleUpdateLinks}
              templates={templates}
              onAdd={handleOpenAddBlockDialog}
              selectedBlock={selectedBlockID}
              onSelectBlock={setSelectedBlockID}
              renderIODecoration={renderIODecoration}
              customParams={customRendererParams}
            />
          </div>
        </div>

        <InputDialog
          open={addBlockDialogOpen}
          title="Add a new Block"
          actionLabel="Add"
          cancelLabel="Cancel"
          fieldLabel="Name"
          onAbort={handleAbortAddBlockDialog}
          onAccept={handleAddBlock}
        />

        <InputDialog
          open={solutionPasswordDialogOpen}
          title="Insert password for solution"
          actionLabel="Check"
          cancelLabel="Cancel"
          fieldLabel="Password"
          onAbort={handleAbortSolutionPasswordDialog}
          onAccept={handleSolution}
        />

        {useAutoMemo(() => (
          <Snackbar open={Boolean(currentError)} onClose={handleCloseError}>
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
      </ThemeProvider>
    </>
  );
}
