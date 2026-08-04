import { createTheme, alpha } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1F3A5F",
      dark: "#14283F",
      light: "#4C6C90",
      contrastText: "#fff",
    },
    secondary: {
      main: "#B85A25",
      light: "#F2E3D6",
      contrastText: "#fff",
    },
    success: { main: "#2E7D32" },
    warning: { main: "#ED6C02" },
    error: { main: "#C62828" },
    info: { main: "#0288D1" },
    background: {
      default: "#F4F6F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A2B3C",
      secondary: "#5B6B73",
    },
    divider: "#D7E0E6",
  },
  typography: {
    fontFamily: ['"Yu Gothic"', '"Noto Sans JP"', "sans-serif"].join(","),
    fontSize: 15,
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#F4F6F8" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#5B6B73",
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #D7E0E6",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F4F6F8",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#14283F",
          fontWeight: 700,
          borderBottom: "2px solid #1F3A5F",
        },
        root: {
          borderLeft: "1px solid rgba(224,224,224,1)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: alpha("#1F3A5F", 0.03),
          },
          "&:hover": {
            backgroundColor: alpha("#1F3A5F", 0.08),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          color: "#14283F",
        },
      },
    },
  },
});

export default theme;
