import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useDrag } from 'react-use-gesture';
import { Theme, Button, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';

import { uuidv4 } from '../utils/utils';

export type IOPort<TPortInfo> = ({ ut: 'template' } & IOPortTemplate<TPortInfo>) | ({ ut: 'inst' } & IOPortInst<TPortInfo>);
export type IOPortTemplate<TPortInfo> = {
  label: string;
  type: 'input' | 'output';
} & TPortInfo;
export type IOPortInst<TPortInfo> = IOPortTemplate<TPortInfo> & {
  blockUuid: string;
  blockName: string;
};
export type BlockTemplate<TBlockInfo, TPortInfo, TPortType = IOPortTemplate<TPortInfo>> = {
  type: string;
  hardcoded: boolean;
  code: string;
  inputs: TPortType[];
  outputs: TPortType[];
  color?: string;
  customRenderer?: (block: Block<TBlockInfo, TPortInfo>, customParams: any) => JSX.Element;
} & TBlockInfo;

export type PosObject = { x: number; y: number };

export type Block<TBlockInfo, TPortInfo> = BlockTemplate<TBlockInfo, IOPortInst<TPortInfo>> & {
  uuid: string;
};

export type Link<TPortInfo> = {
  src: IOPortInst<TPortInfo>;
  dst: IOPortInst<TPortInfo> | null;

  ax?: number;
  ay?: number;
  bx?: number;
  by?: number;
};

function serializeIOPortInst(port: IOPortInst<{}>) {
  return [port.blockUuid, port.blockName, port.label, port.type].join('-');
}
function serializeIOPortTemplate(port: IOPortTemplate<{}>) {
  return [port.label, port.type].join('-');
}

function deserializeIOPort(str: string): IOPortInst<{}> {
  const [blockUuid, blockName, label, type] = str.split('-');
  return {
    blockUuid,
    blockName,
    label,
    type: type as 'input' | 'output',
  };
}

const drawerSize = 25;

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  blockArea: {
    height: '100%',
    flexGrow: 1,
    overflow: 'scroll',
  },
  blockAreaInside: {
    position: 'relative',
    width: '5000px',
    height: '5000px',
  },
  drawer: {
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    width: theme.spacing(drawerSize),
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'column',
    height: '100%',
  },
  drawerScroll: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing(1),

    overflow: 'scroll',
    flexGrow: 1,
    flexBasis: 0,
    // transform: "translate(-17.5%, -17.5%) scale(0.65)",
    '& $block': {
      position: 'static',
      transform: 'translate(0, 0)',
      margin: theme.spacing(1),
    },
  },
  block: {
    whiteSpace: 'nowrap',
    position: 'absolute',
    transform: 'translate(-50%, 0)',
    minWidth: 100,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: ' #424242',
    borderRadius: 8,
    boxShadow: `0px 2px 1px -1px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14),
      0px 1px 3px 0px rgba(0, 0, 0, 0.12)`,
    userSelect: 'none',
    zIndex: 1000,
  },
  selected: {
    outline: '3px solid rgba(255, 0, 0, 0.40)',
  },
  topbar: {
    fontWeight: 600,
    fontSize: 16,
    margin: theme.spacing(1),
    display: 'flex',
  },
  title: {
    flexGrow: 1,
    marginRight: theme.spacing(2),
  },
  io: {
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
    padding: 2,
  },
  custom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
  },
  output: {
    textAlign: 'right',
  },
  svglink: {
    position: 'absolute',
  },
  addButton: {
    margin: theme.spacing(1),
  },
}));

const IOPortRender = React.memo(
  React.forwardRef(function <T>(
    {
      renderIODecoration,
      port,
      ...rest
    }: {
      renderIODecoration: (port: IOPortInst<T>) => JSX.Element;
      port: IOPort<T>;
    },
    ref: React.Ref<HTMLDivElement>,
  ) {
    const classes = useStyles({});

    return (
      <div
        id={port.ut === 'inst' ? 'block-port-' + serializeIOPortInst(port) : undefined}
        className={`${classes.io} ${classes[port.type]}`}
        ref={ref}
        {...rest}
      >
        {port.type === 'input' && (
          <>
            {renderIODecoration(port as IOPortInst<T>)}
            {'<'} {port.label}
          </>
        )}
        {port.type === 'output' && (
          <>
            {port.label} {'>'}
            {renderIODecoration(port as IOPortInst<T>)}
          </>
        )}
      </div>
    );
  }),
);

const BlockTemplateRender = React.memo(function BlockTemplateRender<TBlockInfo, TPortInfo>({
  type,
  color,
  onMove = () => {},
  onMoveStart = () => {},
  onMoveEnd = () => {},
  inputs = [],
  outputs = [],
  parentRef,
}: {
  onMove(point: PosObject): void;
  onMoveStart(type: string, point: PosObject): void;
  onMoveEnd(): void;
  parentRef: React.RefObject<HTMLDivElement>;
} & BlockTemplate<TBlockInfo, TPortInfo>) {
  const classes = useStyles({});

  const bind = useDrag(({ xy: [x, y], first, last }) => {
    const rect = parentRef.current.getBoundingClientRect();

    if (first)
      onMoveStart(type, {
        x: x - rect.x + parentRef.current.scrollLeft,
        y: y - rect.y + parentRef.current.scrollTop,
      });
    if (last) onMoveEnd();
    onMove({
      x: x - rect.x + parentRef.current.scrollLeft,
      y: y - rect.y + parentRef.current.scrollTop,
    });
  });

  return (
    <div {...bind()} className={classes.block} style={{ backgroundColor: color }}>
      <div className={classes.topbar}>
        <div className={classes.title}>{type}</div>
      </div>
      {inputs.map(input => (
        <IOPortRender renderIODecoration={() => null} key={serializeIOPortTemplate(input)} port={{ ...input, ut: 'template' }} />
      ))}
      {outputs.map(output => (
        <IOPortRender renderIODecoration={() => null} key={serializeIOPortTemplate(output)} port={{ ...output, ut: 'template' }} />
      ))}
    </div>
  );
});

function getIOPortPos(element: HTMLElement, right: boolean, scrollOffsetX: number, scrollOffsetY: number) {
  const rect = element.getBoundingClientRect();
  return {
    x: (right ? rect.right : rect.x) + scrollOffsetX,
    y: rect.y + rect.height / 2 + scrollOffsetY,
  };
}

const BlockRender = React.memo(function BlockRender<TBlockInfo, TPortInfo>({
  x,
  y,
  selected = false,
  onSelect = () => {},
  onMove = () => {},
  onDelete = () => {},
  onDragIO = () => {},
  onDragIOStart = () => {},
  onDragIOEnd = () => {},
  renderIODecoration,
  block,
  customParams,
  parentRef,
  onDragStart,
  onDragEnd,
}: {
  x: number;
  y: number;
  selected: boolean;
  onSelect(uuid: string): void;
  onMove(uuid: string, point: PosObject): void;
  onDelete(uuid: string): void;
  onDragIO(src: IOPortInst<{}>, point: PosObject): void;
  onDragIOStart(src: IOPortInst<{}>, point: PosObject): void;
  onDragIOEnd(src: IOPortInst<{}>, dst: IOPortInst<{}> | null): void;
  renderIODecoration: (port: IOPortInst<TPortInfo>) => JSX.Element;
  block: Block<TBlockInfo, TPortInfo>;
  customParams: any;
  parentRef: React.RefObject<HTMLDivElement>;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const classes = useStyles({});

  const { type, inputs, outputs, customRenderer, uuid, color } = block;

  const px = x;
  const py = y;

  const divRef = useRef<HTMLDivElement>();
  const firstTimeRef = useRef<number>();
  const bind = useDrag(({ movement: [mx, my], timeStamp, first, last, memo }) => {
    if (first) {
      firstTimeRef.current = timeStamp;
      memo = { x: Number(divRef.current.style.left.replaceAll('px', '')), y: Number(divRef.current.style.top.replaceAll('px', '')) };
      onDragStart();
    }

    if (last) {
      onDragEnd();
    }

    if (timeStamp - firstTimeRef.current < 100) {
      if (last) onSelect(uuid);
    } else {
      onMove(uuid, { x: mx + memo.x, y: my + memo.y });
    }

    return memo;
  });

  const ioRefs = useRef<{ [key: string]: HTMLElement }>({});
  const updateIORef = (port: IOPortInst<{}>) => (ref: HTMLElement) => {
    ioRefs.current[serializeIOPortInst(port)] = ref;
  };

  const bindIO = useDrag(({ xy: [px, py], first, last, args: [src, right], event }) => {
    const pRect = parentRef.current.getBoundingClientRect();

    if (first) {
      onDragIOStart(
        src,
        getIOPortPos(ioRefs.current[serializeIOPortInst(src)], right, parentRef.current.scrollLeft - pRect.x, parentRef.current.scrollTop - pRect.y),
      );
    }

    onDragIO(src, {
      x: px - pRect.x + parentRef.current.scrollLeft,
      y: py - pRect.y + parentRef.current.scrollTop,
    });

    const lastElements = document.elementsFromPoint(px, py);
    const lastElement = lastElements.find(e => e.id.startsWith('block-port-') && !e.id.includes(uuid));
    if (last) {
      if (lastElement) {
        onDragIOEnd(src, deserializeIOPort(lastElement.id.substring(11)));
      } else {
        onDragIOEnd(src, null);
      }
    }

    event.stopPropagation();
  });

  return (
    <div
      {...bind()}
      ref={divRef}
      className={classes.block + (selected ? ' ' + classes.selected : '')}
      style={{
        left: px,
        top: py,
        backgroundColor: color,
      }}
    >
      {useMemo(
        () => (
          <div className={classes.topbar}>
            <div className={classes.title}>{type}</div>
            <IconButton onClick={() => onDelete(uuid)} size='small'>
              <CloseIcon />
            </IconButton>
          </div>
        ),
        [type, uuid, onDelete, classes.topbar, classes.title],
      )}
      {inputs.map(input => (
        <IOPortRender
          renderIODecoration={renderIODecoration}
          port={{ ...input, ut: 'inst' as const } as any}
          key={serializeIOPortInst(input)}
          ref={updateIORef(input) as any}
          // {...bindIO(input, false)}
        />
      ))}
      {outputs.map(output => (
        <IOPortRender
          renderIODecoration={renderIODecoration}
          port={{ ...output, ut: 'inst' as const }}
          key={serializeIOPortInst(output)}
          ref={updateIORef(output) as any}
          {...bindIO(output, true)}
        />
      ))}
      {customRenderer && <div className={classes.custom}>{customRenderer(block, customParams)}</div>}
    </div>
  );
});

const LinkRender = React.memo(function LinkRender({ link, strokeWidth = 3, markerWidth = 2, markerHeight = 4, onDoubleClick = () => {} }: any) {
  const classes = useStyles({});

  const { ax = 0, ay = 0, bx = 0, by = 0 } = link;

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

  const linkPath = `M${src.x},${src.y}C${(src.x + dst.x) / 2},${src.y} ${(src.x + dst.x) / 2},${dst.y} ${dst.x},${dst.y}`;

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
        <marker id='head' orient='auto' markerWidth={markerWidth} markerHeight={markerHeight} refX={1.5} refY={2}>
          <path d='M0,0 V4 L2,2 Z' fill='#C33' />
        </marker>
      </defs>
      <path d={linkPath} markerEnd='url(#head)' stroke='#C33' strokeWidth={strokeWidth} fill='none' onDoubleClick={() => onDoubleClick(link)} />
    </svg>
  );
});

function searchTrueIOPort<TBlockInfo, TPortInfo>(port: IOPortInst<{}>, blocks: Block<TBlockInfo, TPortInfo>[]) {
  const block = blocks.find(b => b.uuid === port.blockUuid);
  if (block) {
    const input = port.type === 'input' && block.inputs.find(i => i.label === port.label);
    const output = port.type === 'output' && block.outputs.find(i => i.label === port.label);
    return input || output;
  } else {
    return null;
  }
}

export default function BlockEditor<TBlockInfo, TPortInfo>({
  templates,
  blocks,
  setBlocks,
  blocksPos,
  setBlocksPos,
  links,
  setLinks,
  getUuid = uuidv4,
  onAdd = () => {},
  selectedBlock = null,
  onSelectBlock = () => {},
  renderIODecoration = () => null,
  customParams,
  onDragAction,
}: {
  templates: BlockTemplate<TBlockInfo, TPortInfo>[];
  blocks: Block<TBlockInfo, TPortInfo>[];
  setBlocks(fn: (blocks: Block<TBlockInfo, TPortInfo>[]) => Block<TBlockInfo, TPortInfo>[]): void;
  blocksPos: { uuid: string; x: number; y: number }[];
  setBlocksPos(
    fn: (
      blocksPos: {
        uuid: string;
        x: number;
        y: number;
      }[],
    ) => { uuid: string; x: number; y: number }[],
  ): void;
  links: Link<TPortInfo>[];
  setLinks(fn: (links: Link<TPortInfo>[]) => Link<TPortInfo>[]): void;
  getUuid?(): string;
  onAdd(): void;
  selectedBlock: string;
  onSelectBlock: (selected: string) => void;
  renderIODecoration?: (port: IOPortInst<TPortInfo>) => JSX.Element;
  customParams: any;
  onDragAction: (dragging: boolean) => void;
}) {
  const classes = useStyles({});

  const areaRef = useRef<HTMLDivElement>();

  const [draggingTemplate, setDraggingTemplate] = useState(null);
  const handleMoveTemplateStart = useCallback(
    (type: string, pos: { x: number; y: number }) => {
      const uuid = getUuid();
      const template = templates.find(t => t.type === type);

      setBlocks(blocks => {
        const newBlock: Block<TBlockInfo, TPortInfo> = {
          ...template,
          uuid,
          inputs: template.inputs.map(e => ({
            ...e,
            blockUuid: uuid,
            blockName: template.type,
            ut: 'inst',
          })),
          outputs: template.outputs.map(e => ({
            ...e,
            blockUuid: uuid,
            blockName: template.type,
            ut: 'inst',
          })),
        };

        return [...blocks, newBlock];
      });

      setBlocksPos(poss => [
        ...poss,
        {
          uuid,
          x: Math.max(0, pos.x),
          y: Math.max(0, pos.y),
        },
      ]);

      setDraggingTemplate(uuid);
      onDragAction(true);
    },
    [templates, getUuid, setBlocks, setBlocksPos, onDragAction],
  );
  const handleMoveTemplate = useCallback(
    (pos: PosObject) => {
      return setBlocksPos(poss =>
        poss.map(b =>
          b.uuid === draggingTemplate
            ? {
                ...b,
                x: Math.max(0, pos.x),
                y: Math.max(0, pos.y),
              }
            : b,
        ),
      );
    },
    [draggingTemplate, setBlocksPos],
  );
  const handleMoveTemplateEnd = useCallback(() => {
    setDraggingTemplate(null);
    onDragAction(false);
  }, [onDragAction]);

  const handleMoveBlock = useCallback(
    (uuid: string, pos: PosObject) => {
      setBlocksPos(poss => poss.map(block => (block.uuid === uuid ? { ...block, x: Math.max(0, pos.x), y: Math.max(0, pos.y) } : block)));
    },
    [setBlocksPos],
  );
  const handleDeleteBlock = useCallback(
    (uuid: string) => {
      setBlocks(blocks => blocks.filter(block => block.uuid !== uuid));
      setBlocksPos(poss => poss.filter(block => block.uuid !== uuid));
    },
    [setBlocks, setBlocksPos],
  );

  const handleDragIOStart = useCallback(
    (src: IOPortInst<TPortInfo>, { x, y }) => {
      setLinks(links => [
        {
          src,
          dst: null,
          ax: x,
          ay: y,
          bx: x,
          by: y,
        },
        ...links,
      ]);
    },
    [setLinks],
  );
  const handleDragIO = useCallback(
    (src: IOPortInst<TPortInfo>, { x, y }) => {
      setLinks(links => links.map(l => (serializeIOPortInst(l.src) === serializeIOPortInst(src) && l.dst === null ? { ...l, bx: x, by: y } : l)));
    },
    [setLinks],
  );
  const handleDragIOEnd = useCallback(
    (src: IOPortInst<TPortInfo>, dst: IOPortInst<TPortInfo> | null) => {
      if (dst) {
        setLinks(links =>
          links.map(l =>
            serializeIOPortInst(l.src) === serializeIOPortInst(src) && l.dst === null
              ? {
                  src: searchTrueIOPort(src, blocks),
                  dst: searchTrueIOPort(dst, blocks),
                }
              : l,
          ),
        );
      } else {
        setLinks(links => links.filter(l => !(serializeIOPortInst(l.src) === serializeIOPortInst(src) && l.dst === null)));
      }
    },
    [blocks, setLinks],
  );

  const handleRemoveLink = useCallback(
    (link: Link<TPortInfo>) => {
      setLinks(links =>
        links.filter(l => !(serializeIOPortInst(link.src) === serializeIOPortInst(l.src) && serializeIOPortInst(link.dst) === serializeIOPortInst(l.dst))),
      );
    },
    [setLinks],
  );

  const [linksWithPos, setLinksWithPos] = useState(null);
  useEffect(() => {
    const pRect = areaRef.current.getBoundingClientRect();

    setLinksWithPos(
      links.map(link => {
        if (link.dst) {
          const elStart = document.getElementById('block-port-' + serializeIOPortInst(link.src));
          const elEnd = document.getElementById('block-port-' + serializeIOPortInst(link.dst));

          if (elStart && elEnd) {
            const posStart = getIOPortPos(elStart, true, areaRef.current.scrollLeft - pRect.x, areaRef.current.scrollTop - pRect.y);
            const posEnd = getIOPortPos(elEnd, false, areaRef.current.scrollLeft - pRect.x, areaRef.current.scrollTop - pRect.y);

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
      }),
    );
  }, [links, blocksPos]);

  const handleDragStart = useCallback(() => onDragAction(true), [onDragAction]);
  const handleDragEnd = useCallback(() => onDragAction(false), [onDragAction]);

  return (
    <div className={classes.root}>
      <div className={classes.drawer}>
        <div className={classes.drawerScroll}>
          {templates.map(block => (
            <BlockTemplateRender
              {...block}
              key={block.type}
              onMove={handleMoveTemplate}
              onMoveStart={handleMoveTemplateStart}
              onMoveEnd={handleMoveTemplateEnd}
              parentRef={areaRef}
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

      <div ref={areaRef} className={classes.blockArea}>
        <div ref={areaRef} className={classes.blockAreaInside}>
          {blocks.map((block: Block<TBlockInfo, TPortInfo>) => {
            const { x, y } = blocksPos.find(p => p.uuid === block.uuid);

            return (
              <BlockRender
                x={x}
                y={y}
                key={block.uuid}
                selected={selectedBlock === block.uuid}
                onSelect={onSelectBlock}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMove={handleMoveBlock}
                onDelete={handleDeleteBlock}
                onDragIOStart={handleDragIOStart}
                onDragIO={handleDragIO}
                onDragIOEnd={handleDragIOEnd}
                renderIODecoration={renderIODecoration}
                block={block}
                customParams={customParams}
                parentRef={areaRef}
              />
            );
          })}

          {linksWithPos &&
            linksWithPos.map(link => (
              <LinkRender
                link={link}
                onDoubleClick={handleRemoveLink}
                key={(link.src ? serializeIOPortInst(link.src) : 'tba' + uuidv4()) + '-link-' + (link.dst ? serializeIOPortInst(link.dst) : 'tba' + uuidv4())}
                parentRef={areaRef}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
