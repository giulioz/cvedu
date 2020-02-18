import React, { useState, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Slider, Input } from "@material-ui/core";
import { useDrag } from "react-use-gesture";

import { Block } from "./BlockEditor";

const useStyles = makeStyles(theme => ({
  numberHelper: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  yuvRoot: {
    margin: theme.spacing(1),
    width: theme.spacing(15),
    height: theme.spacing(15),
    backgroundImage: "url(/yuv.png)",
    backgroundSize: "cover",
    position: "relative",
  },
  pickerPoint: {
    width: 4,
    height: 4,
    borderRadius: "100%",
    border: "1px solid black",
    position: "absolute",
  },
}));

export const NumberInputHelper = React.memo(function NumberInputHelper<
  BlockInfo,
  IOPortInfo
>({
  customValueRef,
  block,
  minValue,
  maxValue,
  step,
}: {
  customValueRef: React.RefObject<{ [key: string]: any }>;
  block: Block<BlockInfo, IOPortInfo>;
  minValue: number;
  maxValue: number;
  step: number;
}) {
  const classes = useStyles({});

  const value = customValueRef.current[block.uuid]
    ? customValueRef.current[block.uuid].Number
    : 0;

  const [tempValue, setTempValue] = useState(String(value));

  function handleChange(s: string) {
    setTempValue(s);

    const n = parseFloat(s);
    if (!isNaN(n)) {
      customValueRef.current[block.uuid] = { Number: n };
    }
  }

  function handleSliderChange(e: React.ChangeEvent<{}>, n: number) {
    customValueRef.current[block.uuid] = { Number: n };
    setTempValue(String(n));

    e.stopPropagation();
  }

  return (
    <Grid
      container
      spacing={2}
      alignItems="center"
      className={classes.numberHelper}
    >
      <Grid item xs>
        <Slider
          value={value || 0}
          onChange={handleSliderChange}
          min={minValue}
          max={maxValue}
          step={step}
        />
      </Grid>
      <Grid item>
        <Input
          value={tempValue}
          margin="dense"
          onChange={e => handleChange(e.target.value)}
          inputProps={{
            min: minValue,
            max: maxValue,
            type: "number",
          }}
        />
      </Grid>
    </Grid>
  );
});

export const UVInputHelper = React.memo(function UVInputHelper<
  BlockInfo,
  IOPortInfo
>({
  customValueRef,
  block,
}: {
  customValueRef: React.RefObject<{ [key: string]: any }>;
  block: Block<BlockInfo, IOPortInfo>;
}) {
  const classes = useStyles({});

  const rectRef = useRef<HTMLDivElement>();

  const [tempValue, setTempValue] = useState(
    customValueRef.current[block.uuid] || { U: 0, V: 0 }
  );

  const bind = useDrag(({ xy: [x, y], event }) => {
    const bounds = rectRef.current.getBoundingClientRect();
    const tx = Math.min(bounds.width, Math.max(0, x - bounds.x));
    const ty = Math.min(bounds.height, Math.max(0, y - bounds.y));
    const nx = (tx / bounds.width) * 255;
    const ny = (1 - ty / bounds.height) * 255;

    setTempValue({ U: nx, V: ny, x: tx, y: ty });
    customValueRef.current[block.uuid] = { U: nx, V: ny };

    event.stopPropagation();
  });

  return (
    <div {...bind()} ref={rectRef} className={classes.yuvRoot}>
      <div
        className={classes.pickerPoint}
        style={{ left: tempValue.x, top: tempValue.y }}
      ></div>
    </div>
  );
});
