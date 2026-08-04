import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import * as Icons from "@mui/icons-material";

const ContentDialog = ({ open, closeDialog, title, ...props }) => {
  return (
    <Dialog
      maxWidth="lg"
      fullWidth
      open={open}
      onClose={closeDialog}
      onBackdropClick={closeDialog}
    >
      <DialogTitle>{title} </DialogTitle>
      <IconButton
        size="small"
        onClick={closeDialog}
        sx={{
          position: "absolute",
          right: "1rem",
          top: "0.5rem",
          width: "2rem",
          height: "2rem",
        }}
      >
        <Icons.Close color="error" />
      </IconButton>
      <DialogContent>{props.children}</DialogContent>
    </Dialog>
  );
};

export default ContentDialog;
