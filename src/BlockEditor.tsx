import React, { useState, useRef } from "react";
import { useSpring, animated, config as springConfig } from "react-spring";
import { useDrag } from "react-use-gesture";
import { Theme, Button, IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";

import { uuidv4 } from "./utils";

export type IOPort =
  | ({ ut: "template" } & IOPortTemplate)
  | ({ ut: "inst" } & IOPortInst);
export type IOPortTemplate = {
  label: string;
  type: "input" | "output";
};
export type IOPortInst = IOPortTemplate & {
  blockUuid: string;
  blockName: string;
};
export type BlockTemplate<TBlockInfo, TPortType = IOPortTemplate> = {
  type: string;
  hardcoded: boolean;
  code: string;
  inputs: TPortType[];
  outputs: TPortType[];
} & TBlockInfo;

export type PosObject = { x: number; y: number };

export type Block<TBlockInfo> = BlockTemplate<TBlockInfo, IOPortInst> & {
  uuid: string;
} & PosObject;

export type Link = {
  src: IOPortInst;
  dst: IOPortInst | null;

  ax?: number;
  ay?: number;
  bx?: number;
  by?: number;
};

function serializeIOPortInst(port: IOPortInst) {
  return [port.blockUuid, port.blockName, port.label, port.type].join("-");
}
function serializeIOPortTemplate(port: IOPortTemplate) {
  return [port.label, port.type].join("-");
}

function deserializeIOPort(str: string): IOPortInst {
  const [blockUuid, blockName, label, type] = str.split("-");
  return {
    blockUuid,
    blockName,
    label,
    type: type as "input" | "output",
  };
}

const drawerSize = 25;

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  drawer: {
    borderRight: "1px solid rgba(255, 255, 255, 0.12)",
    width: theme.spacing(drawerSize),
    flexGrow: 1,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "column",
  },
  drawerScroll: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",

    overflow: "scroll",
    flexGrow: 1,
    flexBasis: 0,
    // transform: "translate(-17.5%, -17.5%) scale(0.65)",
    "& $block": {
      position: "static",
      transform: "translate(0, 0)",
      margin: theme.spacing(2),
    },
  },
  block: {
    whiteSpace: "nowrap",
    position: "absolute",
    transform: "translate(-50%, 0)",
    minWidth: 100,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backgroundColor: " #424242",
    borderRadius: 8,
    boxShadow: `0px 2px 1px -1px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14),
      0px 1px 3px 0px rgba(0, 0, 0, 0.12)`,
    userSelect: "none",
  },
  selected: {
    border: "2px solid rgba(255, 0, 0, 0.32)",
  },
  topbar: {
    fontWeight: 600,
    fontSize: 16,
    margin: theme.spacing(1),
    display: "flex",
  },
  title: {
    flexGrow: 1,
    marginRight: theme.spacing(2),
  },
  io: {
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
    padding: 2,
  },
  output: {
    textAlign: "right",
  },
  svglink: {
    position: "absolute",
  },
  addButton: {
    margin: theme.spacing(1),
  },
}));

const IOPortRender = React.forwardRef(
  ({ port, ...rest }: { port: IOPort }, ref: React.Ref<HTMLDivElement>) => {
    const classes = useStyles({});

    return (
      <div
        id={
          port.ut === "inst"
            ? "block-port-" + serializeIOPortInst(port)
            : undefined
        }
        className={`${classes.io} ${classes[port.type]}`}
        ref={ref}
        {...rest}
      >
        {port.type === "input" && (
          <>
            {"<"} {port.label}
          </>
        )}
        {port.type === "output" && (
          <>
            {port.label} {">"}
          </>
        )}
      </div>
    );
  }
);

function BlockTemplateRender<TBlockInfo>({
  type,
  onMove = () => {},
  onMoveStart = () => {},
  onMoveEnd = () => {},
  inputs = [],
  outputs = [],
}: {
  onMove(point: PosObject): void;
  onMoveStart(point: PosObject): void;
  onMoveEnd(): void;
} & BlockTemplate<TBlockInfo>) {
  const classes = useStyles({});

  const bind = useDrag(({ xy: [x, y], first, last }) => {
    if (first) onMoveStart({ x, y });
    if (last) onMoveEnd();
    onMove({ x, y });
  });

  return (
    <div {...bind()} className={classes.block}>
      <div className={classes.topbar}>
        <div className={classes.title}>{type}</div>
      </div>
      {inputs.map(input => (
        <IOPortRender
          key={serializeIOPortTemplate(input)}
          port={{ ...input, ut: "template" }}
        />
      ))}
      {outputs.map(output => (
        <IOPortRender
          key={serializeIOPortTemplate(output)}
          port={{ ...output, ut: "template" }}
        />
      ))}
    </div>
  );
}

function getIOPortPos(element: HTMLElement, right: boolean) {
  const rect = element.getBoundingClientRect();
  return {
    x: right ? rect.right : rect.x,
    y: rect.y + rect.height / 2,
  };
}

function BlockRender<TBlockInfo>({
  x,
  y,
  type,
  selected = false,
  onSelect = () => {},
  onMove = () => {},
  onDelete = () => {},
  onDragIO = () => {},
  onDragIOStart = () => {},
  onDragIOEnd = () => {},
  onRest = () => {},
  inputs = [],
  outputs = [],
}: {
  x: number;
  y: number;
  selected: boolean;
  onSelect(): void;
  onMove(point: PosObject): void;
  onDelete(): void;
  onDragIO(src: IOPortInst, point: PosObject): void;
  onDragIOStart(src: IOPortInst, point: PosObject): void;
  onDragIOEnd(src: IOPortInst, dst: IOPortInst): void;
  onRest(): void;
} & Block<TBlockInfo>) {
  const classes = useStyles({});

  const { px, py } = useSpring({
    px: x || 0,
    py: y || 0,
    config: springConfig.stiff,
    onRest,
  });

  const divRef = useRef<HTMLDivElement>();
  const firstTimeRef = useRef<number>();
  const bind = useDrag(({ delta: [px, py], time, first, last }) => {
    if (first) firstTimeRef.current = time;

    if (time - firstTimeRef.current < 100) {
      if (last) onSelect();
    } else {
      if (divRef.current && (x === undefined || y === undefined)) {
        const rect = divRef.current.getBoundingClientRect();
        x = rect.x + rect.width / 2;
        y = rect.y;
      }

      onMove({ x: px + x, y: py + y });
    }
  });

  const ioRefs = useRef<{ [key: string]: HTMLElement }>({});
  const updateIORef = (port: IOPortInst) => (ref: HTMLElement) => {
    ioRefs.current[serializeIOPortInst(port)] = ref;
  };

  const bindIO = useDrag(
    ({ xy: [px, py], first, last, args: [src, right], event }) => {
      if (first) {
        onDragIOStart(
          src,
          getIOPortPos(ioRefs.current[serializeIOPortInst(src)], right)
        );
      }

      onDragIO(src, { x: px, y: py });

      const lastElement = document.elementFromPoint(px, py);
      if (last)
        onDragIOEnd(src, deserializeIOPort(lastElement.id.substring(11)));

      event.stopPropagation();
    }
  );

  return (
    <animated.div
      {...bind()}
      ref={divRef}
      className={classes.block + (selected ? " " + classes.selected : "")}
      style={{
        left: px,
        top: py,
      }}
    >
      <div className={classes.topbar}>
        <div className={classes.title}>{type}</div>
        <IconButton onClick={onDelete} size="small">
          <CloseIcon />
        </IconButton>
      </div>
      {inputs.map(input => (
        <IOPortRender
          port={{ ...input, ut: "inst" as const }}
          key={serializeIOPortInst(input)}
          ref={updateIORef(input) as any}
          // {...bindIO(input, false)}
        />
      ))}
      {outputs.map(output => (
        <IOPortRender
          port={{ ...output, ut: "inst" as const }}
          key={serializeIOPortInst(output)}
          ref={updateIORef(output) as any}
          {...bindIO(output, true)}
        />
      ))}
    </animated.div>
  );
}

function LinkRender({
  ax = 0,
  ay = 0,
  bx = 0,
  by = 0,
  strokeWidth = 3,
  markerWidth = 2,
  markerHeight = 4,
}) {
  const classes = useStyles({});

  const x = Math.min(ax, bx);
  const y = Math.min(ay, by);
  const width = Math.max(ax, bx) - x;
  const height = Math.max(ay, by) - y;

  const src = {
    x: ax - x + strokeWidth / 2 - markerWidth,
    y: ay - y + strokeWidth / 2 + markerHeight,
  };
  const dst = {
    x: bx - x + strokeWidth / 2 - markerWidth,
    y: by - y + strokeWidth / 2 + markerHeight,
  };

  const link = `M${src.x},${src.y}C${(src.x + dst.x) / 2},${src.y} ${(src.x +
    dst.x) /
    2},${dst.y} ${dst.x},${dst.y}`;

  return (
    <svg
      className={classes.svglink}
      style={{
        left: x,
        top: y - markerHeight,
      }}
      width={width + strokeWidth + markerWidth * 2}
      height={height + strokeWidth + markerHeight * 2}
    >
      <defs>
        <marker
          id="head"
          orient="auto"
          markerWidth={markerWidth}
          markerHeight={markerHeight}
          refX={1.5}
          refY={2}
        >
          <path d="M0,0 V4 L2,2 Z" fill="#C33" />
        </marker>
      </defs>
      <path
        d={link}
        markerEnd="url(#head)"
        stroke="#C33"
        strokeWidth={strokeWidth}
        fill="none"
      />
    </svg>
  );
}

export default function BlockEditor<TBlockInfo>({
  templates,
  blocks,
  setBlocks,
  links,
  setLinks,
  getUuid = uuidv4,
  onAdd = () => {},
  selectedBlock = null,
  onSelectBlock = () => {},
}: {
  templates: BlockTemplate<TBlockInfo>[];
  blocks: Block<TBlockInfo>[];
  setBlocks(fn: (blocks: Block<TBlockInfo>[]) => Block<TBlockInfo>[]): void;
  links: Link[];
  setLinks(fn: (links: Link[]) => Link[]): void;
  getUuid?(): string;
  onAdd(): void;
  selectedBlock: string;
  onSelectBlock(fn: (selected: string) => string): void;
}) {
  const classes = useStyles({});

  const [draggingTemplate, setDraggingTemplate] = useState(null);
  const handleMoveTemplateStart = (type: string) => (pos: {
    x: number;
    y: number;
  }) => {
    const uuid = getUuid();
    const template = templates.find(t => t.type === type);

    setBlocks(blocks => {
      const newBlock: Block<TBlockInfo> = {
        ...template,
        ...pos,
        uuid,
        inputs: template.inputs.map(e => ({
          ...e,
          blockUuid: uuid,
          blockName: template.type,
          ut: "inst",
        })),
        outputs: template.outputs.map(e => ({
          ...e,
          blockUuid: uuid,
          blockName: template.type,
          ut: "inst",
        })),
      };

      return [...blocks, newBlock];
    });

    setDraggingTemplate(uuid);
  };
  function handleMoveTemplate(pos: PosObject) {
    return setBlocks(blocks =>
      blocks.map(b => (b.uuid === draggingTemplate ? { ...b, ...pos } : b))
    );
  }
  const handleMoveTemplateEnd = () => setDraggingTemplate(null);

  const handleMoveBlock = (uuid: string) => (pos: PosObject) => {
    setBlocks(blocks =>
      blocks.map(block => (block.uuid === uuid ? { ...block, ...pos } : block))
    );
  };
  const handleSelectBlock = (uuid: string) => () => {
    onSelectBlock(selected => (selected === uuid ? null : uuid));
  };
  const handleDeleteBlock = (uuid: string) => () => {
    setBlocks(blocks => blocks.filter(block => block.uuid !== uuid));
  };

  function handleDragIOStart(src: IOPortInst, { x, y }) {
    setLinks(links => [
      { src, dst: null, ax: x, ay: y, bx: x, by: y },
      ...links.filter(l => serializeIOPortInst(l.src) !== serializeIOPortInst(src)),
    ]);
  }
  function handleDragIO(src: IOPortInst, { x, y }) {
    setLinks(links =>
      links.map(l =>
        serializeIOPortInst(l.src) === serializeIOPortInst(src)
          ? { ...l, bx: x, by: y }
          : l
      )
    );
  }
  function handleDragIOEnd(src: IOPortInst, dst: IOPortInst) {
    setLinks(links =>
      links.map(l =>
        serializeIOPortInst(l.src) === serializeIOPortInst(src)
          ? { src, dst }
          : l
      )
    );
  }

  const linksWithPosGen = () =>
    links.map(link => {
      if (link.dst) {
        const elStart = document.getElementById(
          "block-port-" + serializeIOPortInst(link.src)
        );
        const elEnd = document.getElementById(
          "block-port-" + serializeIOPortInst(link.dst)
        );

        if (elStart && elEnd) {
          const posStart = getIOPortPos(elStart, true);
          const posEnd = getIOPortPos(elEnd, false);

          return {
            ...link,
            ax: posStart.x,
            ay: posStart.y,
            bx: posEnd.x,
            by: posEnd.y,
          };
        }

        return link;
      }

      return link;
    });
  const linksWithPos = linksWithPosGen();

  const setForceUpdate = useState(0)[1];
  function updateLinkPos() {
    const newLinksWithPos = linksWithPosGen();
    const hasToUpdate = newLinksWithPos.some(
      (link, i) =>
        linksWithPos[i].ax !== link.ax ||
        linksWithPos[i].ay !== link.ay ||
        linksWithPos[i].bx !== link.bx ||
        linksWithPos[i].by !== link.by
    );

    if (hasToUpdate) {
      setForceUpdate(i => i + 1);
    }
  }

  return (
    <div className={classes.root}>
      {linksWithPos.map(link => (
        <LinkRender
          {...link}
          key={
            (link.src ? serializeIOPortInst(link.src) : "tba") +
            "-link-" +
            (link.dst ? serializeIOPortInst(link.dst) : "tba")
          }
        />
      ))}

      <div className={classes.drawer}>
        <div className={classes.drawerScroll}>
          {templates.map(block => (
            <BlockTemplateRender
              {...block}
              key={block.type}
              onMove={handleMoveTemplate}
              onMoveStart={handleMoveTemplateStart(block.type)}
              onMoveEnd={handleMoveTemplateEnd}
            />
          ))}
        </div>

        {/* <Button
          color="primary"
          variant="contained"
          onClick={onAdd}
          className={classes.addButton}
        >
          <AddIcon />
        </Button> */}
      </div>

      {blocks.map(block => (
        <BlockRender
          {...block}
          key={block.uuid}
          selected={selectedBlock === block.uuid}
          onSelect={handleSelectBlock(block.uuid)}
          onMove={handleMoveBlock(block.uuid)}
          onDelete={handleDeleteBlock(block.uuid)}
          onDragIOStart={handleDragIOStart}
          onDragIO={handleDragIO}
          onDragIOEnd={handleDragIOEnd}
          onRest={updateLinkPos}
        />
      ))}
    </div>
  );
}
