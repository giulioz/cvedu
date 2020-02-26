import React, { useState } from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

export const InputDialog = React.memo(function InputDialog({
  open = false,
  title = "",
  actionLabel = "OK",
  cancelLabel = "Cancel",
  fieldLabel = "",
  onAbort = () => {},
  onAccept = () => {},
}: {
  open: boolean;
  title: string;
  actionLabel: string;
  cancelLabel: string;
  fieldLabel: string;
  onAbort: () => void;
  onAccept: (value: string) => void;
}) {
  const [currentValue, setCurrentValue] = useState("");

  function handleAbort() {
    setCurrentValue("");
    onAbort();
  }

  function handleAccept() {
    onAccept(currentValue);
    setCurrentValue("");
  }

  return (
    <Dialog open={open} onClose={onAbort} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          value={currentValue}
          onChange={e => setCurrentValue(e.target.value)}
          label={fieldLabel}
          margin="dense"
          variant="outlined"
          autoFocus
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleAbort} variant="text" color="default">
          {cancelLabel}
        </Button>
        <Button onClick={handleAccept} variant="contained" color="primary">
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
