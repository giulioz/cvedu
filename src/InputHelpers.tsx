import React, { useState, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Slider, Input, Select, MenuItem } from "@material-ui/core";
import { useDrag } from "react-use-gesture";

import { Block } from "./BlockEditor";
import { useDefaultInputImages } from "./inputImages";

const useStyles = makeStyles(theme => ({
  numberHelper: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  numberField: {
    width: theme.spacing(4),
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
  frameRoot: {
    margin: theme.spacing(1),
    width: theme.spacing(20),
  },
  frameSelect: {
    width: "100%",
  },
}));

export const NumberInputHelper = React.memo(function NumberInputHelper<
  BlockInfo,
  IOPortInfo
>({
  customValues,
  setCustomValues,
  block,
  minValue,
  maxValue,
  step,
}: {
  customValues: { [key: string]: any };
  setCustomValues: (
    fn: (old: { [key: string]: any }) => { [key: string]: any }
  ) => void;
  block: Block<BlockInfo, IOPortInfo>;
  minValue: number;
  maxValue: number;
  step: number;
}) {
  const classes = useStyles({});

  const value = customValues[block.uuid] ? customValues[block.uuid].Number : 0;

  const [tempValue, setTempValue] = useState(String(value));

  function handleChange(s: string) {
    setTempValue(s);

    const n = parseFloat(s);
    if (!isNaN(n)) {
      setCustomValues(old => ({ ...old, [block.uuid]: { Number: n } }));
    }
  }

  function handleSliderChange(e: React.ChangeEvent<{}>, n: number) {
    setCustomValues(old => ({ ...old, [block.uuid]: { Number: n } }));
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
          className={classes.numberField}
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
  customValues,
  setCustomValues,
  block,
}: {
  customValues: { [key: string]: any };
  setCustomValues: (
    fn: (old: { [key: string]: any }) => { [key: string]: any }
  ) => void;
  block: Block<BlockInfo, IOPortInfo>;
}) {
  const classes = useStyles({});

  const rectRef = useRef<HTMLDivElement>();

  const [tempValue, setTempValue] = useState(
    customValues[block.uuid] || { U: 0, V: 0 }
  );

  const bind = useDrag(({ xy: [x, y], event }) => {
    const bounds = rectRef.current.getBoundingClientRect();
    const tx = Math.min(bounds.width, Math.max(0, x - bounds.x));
    const ty = Math.min(bounds.height, Math.max(0, y - bounds.y));
    const nx = (tx / bounds.width) * 255;
    const ny = (1 - ty / bounds.height) * 255;

    setTempValue({ U: nx, V: ny, x: tx, y: ty });
    setCustomValues(old => ({ ...old, [block.uuid]: { U: nx, V: ny } }));

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

export const FrameInputHelper = React.memo(function FrameInputHelper<
  BlockInfo,
  IOPortInfo
>({
  customValues,
  setCustomValues,
  block,
}: {
  customValues: { [key: string]: any };
  setCustomValues: (
    fn: (old: { [key: string]: any }) => { [key: string]: any }
  ) => void;
  block: Block<BlockInfo, IOPortInfo>;
}) {
  const classes = useStyles({});

  const images = useDefaultInputImages();

  const value = customValues[block.uuid]
    ? customValues[block.uuid].selected
    : -1;

  function handleChange(event: React.ChangeEvent<{ value: number }>) {
    const i = event.target.value;
    const image = images[i];

    setCustomValues(old => ({
      ...old,
      [block.uuid]: { selected: i, Frame: image && image.imageData },
    }));
  }

  return (
    <div className={classes.frameRoot}>
      <Select
        value={value}
        onChange={handleChange}
        className={classes.frameSelect}
      >
        <MenuItem key={-1} value={-1}>
          None
        </MenuItem>
        {images.map((image, i) => (
          <MenuItem key={i} value={i}>
            {image.label}
          </MenuItem>
        ))}
      </Select>
    </div>
  );
});
