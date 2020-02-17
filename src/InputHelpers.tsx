import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Slider, Input } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  numberHelper: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

export function NumberInputHelper({
  value,
  setValue,
  minValue,
  maxValue,
  step,
}: {
  value?: number;
  setValue: (value: number) => void;
  minValue: number;
  maxValue: number;
  step: number;
}) {
  const classes = useStyles({});

  const [tempValue, setTempValue] = useState("0");

  function handleChange(s: string) {
    setTempValue(s);

    const n = parseFloat(s);
    if (!isNaN(n)) {
      setValue(n);
    }
  }

  function handleSliderChange(e: React.ChangeEvent<{}>, n: number) {
    setValue(n);
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
}
