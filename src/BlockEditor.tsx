import React, { useState, useRef } from "react";
import { useSpring, animated, config as springConfig } from "react-spring";
import { useDrag } from "react-use-gesture";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  drawer: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    width: 180,
    height: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "column",
    overflow: "scroll",
    // transform: "translate(-17.5%, -17.5%) scale(0.65)",
    "& $block": {
      position: "static",
      transform: "translate(0, 0)",
      margin: 16
    }
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
    userSelect: "none"
  },
  topbar: {
    fontWeight: 600,
    fontSize: 16,
    margin: 8,
    display: "flex"
  },
  title: {
    flexGrow: 1,
    marginRight: 32
  },
  deleteButton: {
    fontWeight: 300
  },
  io: {
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
    padding: 2
  },
  output: {
    textAlign: "right"
  },
  svglink: {
    position: "absolute"
  }
}));

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const IOPort = React.forwardRef<typeof HTMLDivElement, any>(
  ({ type = "input", label, uuid, ...rest }, ref) => {
    const classes = useStyles({});

    return (
      <div
        id={"block-port-" + uuid}
        className={`${classes.io} ${classes[type]}`}
        ref={ref}
        {...rest}
      >
        {type === "input" && (
          <>
            {"<"} {label}
          </>
        )}
        {type === "output" && (
          <>
            {label} {">"}
          </>
        )}
      </div>
    );
  }
);

function BlockTemplate({
  type,
  onMove = () => {},
  onMoveStart = () => {},
  onMoveEnd = () => {},
  inputs = [],
  outputs = []
}: any) {
  const classes = useStyles({});

  const bind = useDrag(({ xy: [x, y], first, last }) => {
    if (first) onMoveStart({ x, y });
    if (last) onMoveEnd();
    onMove({ x: x, y: y });
  });

  return (
    <div {...bind()} className={classes.block}>
      <div className={classes.topbar}>
        <div className={classes.title}>{type}</div>
      </div>
      {inputs.map(input => (
        <IOPort key={input.uuid} type="input" {...input} />
      ))}
      {outputs.map(output => (
        <IOPort key={output.uuid} type="output" {...output} />
      ))}
    </div>
  );
}

function getIOPortPos(element: HTMLElement, right: boolean) {
  const rect = element.getBoundingClientRect();
  return {
    x: right ? rect.right : rect.x,
    y: rect.y + rect.height / 2
  };
}

function Block({
  x,
  y,
  type,
  onMove = () => {},
  onDelete = () => {},
  onDragIO = () => {},
  onDragIOStart = () => {},
  onDragIOEnd = () => {},
  onRest = () => {},
  inputs = [],
  outputs = []
}: any) {
  const classes = useStyles({});

  const { px, py } = useSpring({
    px: x || 0,
    py: y || 0,
    config: springConfig.stiff,
    onRest
  });

  const divRef = useRef<HTMLDivElement>();
  const bind = useDrag(({ delta: [px, py] }) => {
    if (divRef.current && (x === undefined || y === undefined)) {
      const rect = divRef.current.getBoundingClientRect();
      x = rect.x + rect.width / 2;
      y = rect.y;
    }

    onMove({ x: px + x, y: py + y });
  });

  const ioRefs = useRef<{ [key: string]: HTMLElement }>({});
  const updateIORef = (uuid: string) => (ref: HTMLElement) => {
    ioRefs.current[uuid] = ref;
  };

  const bindIO = useDrag(
    ({ xy: [px, py], first, last, args: [uuid, right], event }) => {
      if (first) {
        onDragIOStart(uuid, getIOPortPos(ioRefs.current[uuid], right));
      }

      onDragIO(uuid, { x: px, y: py });

      const lastElement = document.elementFromPoint(px, py);
      if (last) onDragIOEnd(uuid, lastElement.id.substring(11));

      event.stopPropagation();
    }
  );

  return (
    <animated.div
      {...bind()}
      ref={divRef}
      className={classes.block}
      style={{
        left: px,
        top: py
      }}
    >
      <div className={classes.topbar}>
        <div className={classes.title}>{type}</div>
        <div className={classes.deleteButton} onClick={onDelete}>
          x
        </div>
      </div>
      {inputs.map(input => (
        <IOPort
          type="input"
          key={input.uuid}
          ref={updateIORef(input.uuid)}
          // {...bindIO(input.uuid, false)}
          {...input}
        />
      ))}
      {outputs.map(output => (
        <IOPort
          type="output"
          key={output.uuid}
          ref={updateIORef(output.uuid)}
          {...bindIO(output.uuid, true)}
          {...output}
        />
      ))}
    </animated.div>
  );
}

function Link({
  ax = 0,
  ay = 0,
  bx = 0,
  by = 0,
  strokeWidth = 3,
  markerWidth = 2,
  markerHeight = 4
}) {
  const classes = useStyles({});

  const x = Math.min(ax, bx);
  const y = Math.min(ay, by);
  const width = Math.max(ax, bx) - x;
  const height = Math.max(ay, by) - y;

  const src = {
    x: ax - x + strokeWidth / 2 - markerWidth,
    y: ay - y + strokeWidth / 2 + markerHeight
  };
  const dst = {
    x: bx - x + strokeWidth / 2 - markerWidth,
    y: by - y + strokeWidth / 2 + markerHeight
  };

  const link = `M${src.x},${src.y}C${(src.x + dst.x) / 2},${src.y} ${(src.x +
    dst.x) /
    2},${dst.y} ${dst.x},${dst.y}`;

  return (
    <svg
      className={classes.svglink}
      style={{
        left: x,
        top: y - markerHeight
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

const templates = [
  {
    type: "Camera Input",
    inputs: [],
    outputs: [{ label: "Frame", uuid: uuidv4() }]
  },
  {
    type: "Chroma Key",
    inputs: [
      { label: "Color", uuid: uuidv4() },
      { label: "Radius", uuid: uuidv4() },
      { label: "Frame", uuid: uuidv4() }
    ],
    outputs: [{ label: "Mask", uuid: uuidv4() }]
  },
  {
    type: "Hough Transf",
    inputs: [{ label: "Mask", uuid: uuidv4() }],
    outputs: [
      { label: "Angle", uuid: uuidv4() },
      { label: "Distance", uuid: uuidv4() }
    ]
  },
  {
    type: "RANSAC",
    inputs: [{ label: "Mask", uuid: uuidv4() }],
    outputs: [
      { label: "Angle", uuid: uuidv4() },
      { label: "Distance", uuid: uuidv4() }
    ]
  },
  {
    type: "Display Frame",
    inputs: [{ label: "Frame", uuid: uuidv4() }],
    outputs: []
  },
  {
    type: "Draw Line",
    inputs: [
      { label: "Frame", uuid: uuidv4() },
      { label: "Angle", uuid: uuidv4() },
      { label: "Distance", uuid: uuidv4() }
    ],
    outputs: [{ label: "Frame", uuid: uuidv4() }]
  },
  {
    type: "RGB to YUV",
    inputs: [{ label: "Frame", uuid: uuidv4() }],
    outputs: [{ label: "Frame", uuid: uuidv4() }]
  }
];

export default function BlockEditor() {
  const classes = useStyles({});

  const [blocks, setBlocks] = useState([]);

  const [draggingTemplate, setDraggingTemplate] = useState(null);
  const handleMoveTemplateStart = type => pos => {
    const uuid = uuidv4();
    const template = templates.find(t => t.type === type);

    setBlocks(blocks => [
      ...blocks,
      {
        ...template,
        ...pos,
        uuid,
        inputs: template.inputs.map(e => ({
          ...e,
          uuid: uuid + " " + e.uuid
        })),
        outputs: template.outputs.map(e => ({
          ...e,
          uuid: uuid + " " + e.uuid
        }))
      }
    ]);

    setDraggingTemplate(uuid);
  };
  function handleMoveTemplate(pos) {
    return setBlocks(blocks =>
      blocks.map(b => (b.uuid === draggingTemplate ? { ...b, ...pos } : b))
    );
  }
  const handleMoveTemplateEnd = () => setDraggingTemplate(null);

  const handleMoveBlock = uuid => pos =>
    setBlocks(blocks =>
      blocks.map(block => (block.uuid === uuid ? { ...block, ...pos } : block))
    );
  const handleDeleteBlock = uuid => () =>
    setBlocks(blocks => blocks.filter(block => block.uuid !== uuid));

  const [links, setLinks] = useState([]);
  function handleDragIOStart(uuidStart, { x, y }) {
    setLinks(links => [
      { uuidStart, uuidEnd: "tba", ax: x, ay: y, bx: x, by: y },
      ...links.filter(l => l.uuidStart !== uuidStart)
    ]);
  }
  function handleDragIO(uuidStart, { x, y }) {
    setLinks(links =>
      links.map(l => (l.uuidStart === uuidStart ? { ...l, bx: x, by: y } : l))
    );
  }
  function handleDragIOEnd(uuidStart, uuidEnd) {
    setLinks(links =>
      links.map(l => (l.uuidStart === uuidStart ? { uuidStart, uuidEnd } : l))
    );
  }

  const linksWithPosGen = () =>
    links.map(link => {
      if (link.uuidEnd !== "tba") {
        // const startBlock = blocks.filter(
        //   b =>
        //     b.outputs.filter(i => i.uuid === link.uuidStart).length > 0,
        // )[0];
        // const endBlock = blocks.filter(
        //   b => b.inputs.filter(i => i.uuid === link.uuidEnd).length > 0,
        // )[0];

        const elStart = document.getElementById("block-port-" + link.uuidStart);
        const elEnd = document.getElementById("block-port-" + link.uuidEnd);

        if (elStart && elEnd) {
          const posStart = getIOPortPos(elStart, true);
          const posEnd = getIOPortPos(elEnd, false);

          return {
            ...link,
            ax: posStart.x,
            ay: posStart.y,
            bx: posEnd.x,
            by: posEnd.y
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
    <>
      {linksWithPos.map(link => (
        <Link {...link} key={link.uuidStart + "-link-" + link.uuidEnd} />
      ))}

      <div className={classes.drawer}>
        {templates.map(block => (
          <BlockTemplate
            {...block}
            key={block.type}
            onMove={handleMoveTemplate}
            onMoveStart={handleMoveTemplateStart(block.type)}
            onMoveEnd={handleMoveTemplateEnd}
          />
        ))}
      </div>

      {blocks.map(block => (
        <Block
          {...block}
          key={block.uuid}
          onMove={handleMoveBlock(block.uuid)}
          onDelete={handleDeleteBlock(block.uuid)}
          onDragIOStart={handleDragIOStart}
          onDragIO={handleDragIO}
          onDragIOEnd={handleDragIOEnd}
          onRest={updateLinkPos}
        />
      ))}
    </>
  );
}
