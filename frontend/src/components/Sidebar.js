import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Collapse, createTheme } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import CustomerSearch from "./CustomerSearch";
import CaseSearch from "./CaseSearch";
import CaseDetail from "./CaseDetail";
import DocumentSearch from "./document-management/DocumentSearch";
import OrderSearch from "./OrderSearch";
import OrderDetail from "./OrderDetail";
import OrderIntakeUpload from "./OrderIntakeUpload";
import ProductSearch from "./ProductSearch";
import SupplierSearch from "./SupplierSearch";
import SupplierDetail from "./SupplierDetail";
import PurchaseOrderSearch from "./PurchaseOrderSearch";
import PurchaseOrderDetail from "./PurchaseOrderDetail";
import GoodsReceiptSearch from "./GoodsReceiptSearch";
import GoodsReceiptDetail from "./GoodsReceiptDetail";
import ReorderSuggestions from "./ReorderSuggestions";
import PurchaseInvoiceSearch from "./PurchaseInvoiceSearch";
import PurchaseOrderIntakeUpload from "./PurchaseOrderIntakeUpload";
import GoodsReceiptIntakeUpload from "./GoodsReceiptIntakeUpload";
import InvoiceSearch from "./InvoiceSearch";
import SalesDashboard from "./SalesDashboard";
import ChatAssistant from "./ChatAssistant";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import useAuth from "../hooks/useAuth";

const DEFAULT_DRAWER_WIDTH = 340;
const MIN_DRAWER_WIDTH = 220;
const MAX_DRAWER_WIDTH = 480;
const AI_ACCENT_COLOR = "#b85a25";
const AI_ACCENT_SOFT = "#f2e3d6";

const Sidebar = () => {
  const [drawerWidth, setDrawerWidth] = React.useState(DEFAULT_DRAWER_WIDTH);
  const isResizing = React.useRef(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [caseOpen, setCaseOpen] = React.useState(false);
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [supplierOpen, setSupplierOpen] = React.useState(false);
  const [header, setHeader] = React.useState();
  const [activeKey, setActiveKey] = React.useState(null);
  const [caseId, setCaseDetail] = React.useState("");
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isSuperAdmin = auth?.roles?.includes("SuperAdmin");

  const handleResizeStart = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(
        MAX_DRAWER_WIDTH,
        Math.max(MIN_DRAWER_WIDTH, e.clientX)
      );
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const theme = createTheme({
    typography: {
      fontFamily: ['"MS Gothic"', "sans-serif"].join(","),
      fontWeight: 1000,
    },
    components: {},
  });

  const mapPage = (page) => {
    switch (page) {
      case "Customer":
        setHeader("顧客情報の検索");
        break;
      case "Case":
        setCaseOpen(!caseOpen);
        break;
      case "Search Case":
        setHeader("案件の検索");
        break;
      case "Create Case":
        setHeader("案件情報");
        break;
      case "Document Search":
        setHeader("書類管理");
        break;
      case "Order":
        setOrderOpen(!orderOpen);
        break;
      case "Search Order":
        setHeader("受注検索");
        break;
      case "Create Order":
        setHeader("受注登録");
        break;
      case "Upload Order":
        setHeader("受注アップロード（AI読み取り）");
        break;
      case "Product Management":
        setHeader("商品・在庫管理");
        break;
      case "Supplier":
        setSupplierOpen(!supplierOpen);
        break;
      case "Search Supplier":
        setHeader("仕入先検索");
        break;
      case "Search Purchase Order":
        setHeader("発注検索");
        break;
      case "Upload Purchase Order":
        setHeader("発注アップロード（AI）");
        break;
      case "Search Goods Receipt":
        setHeader("入荷検索");
        break;
      case "Upload Goods Receipt":
        setHeader("入荷アップロード（AI）");
        break;
      case "Reorder Suggestions":
        setHeader("発注提案");
        break;
      case "Purchase Invoice Management":
        setHeader("仕入請求書管理");
        break;
      case "Invoice Management":
        setHeader("受注請求書管理");
        break;
      case "Sales Dashboard":
        setHeader("経営ダッシュボード");
        break;
      case "Chat Assistant":
        setHeader("AIチャット");
        break;
      default:
        setHeader("Home");
        break;
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // "Case"/"Order"/"Supplier" only expand/collapse their parent menu — they don't map to an
  // actual page, so they should never be marked as the "selected" item.
  const TOGGLE_ONLY_KEYS = ["Case", "Order", "Supplier"];

  const handleClick = (item) => {
    setCaseDetail("");
    if (!TOGGLE_ONLY_KEYS.includes(item)) {
      setActiveKey(item);
    }
    mapPage(item);
  };

  const hoverButton = {
    "&:hover": {
      backgroundColor: "#11596F",
      color: "#fff",
    },
    "&:active": {
      backgroundColor: "#0E563B",
    },
    "&:hover .MuiListItemIcon-root": {
      color: "#fff",
    },
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: "#11596F",
      color: "#fff",
    },
    "&.Mui-selected .MuiListItemIcon-root": {
      color: "#fff",
    },
  };
  const hoverChildButton = {
    ...hoverButton,
    pl: 4,
    "& .MuiListItemText-primary": {
      fontWeight: 500,
      fontSize: "0.92rem",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "1.15rem",
    },
  };

  const logOut = () => {
    localStorage.removeItem("AuthToken");
    navigate("/login", { replace: true });
  };

  const drawer = (
    <div style={{ color: "#11596F" }}>
      <Toolbar>
        <ListItemButton sx={{ maxWidth: "10rem" }} onClick={logOut}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="ログアウト"></ListItemText>
        </ListItemButton>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton
          onClick={() => handleClick("Customer")}
          selected={activeKey === "Customer"}
          sx={hoverButton}
        >
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="顧客情報管理"></ListItemText>
        </ListItemButton>
      </List>
      {/* 案件管理 — ẩn theo yêu cầu, giữ code để bật lại sau này
      <List>
        <ListItemButton onClick={() => handleClick("Case")} sx={hoverButton}>
          <ListItemIcon>
            <BusinessCenterIcon />
          </ListItemIcon>
          <ListItemText primary="案件管理"></ListItemText>
          {caseOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={caseOpen} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              ml: "20px",
              borderLeft: "3px solid #cfe0e6",
              backgroundColor: "rgba(17, 89, 111, 0.03)",
            }}
          >
            <ListItemButton
              sx={hoverChildButton}
              onClick={() => handleClick("Search Case")}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="案件検索" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              onClick={() => handleClick("Create Case")}
            >
              <ListItemIcon>
                <AddBusinessIcon />
              </ListItemIcon>
              <ListItemText primary="案件作成" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
      */}
      <List>
        <ListItemButton
          sx={hoverButton}
          selected={activeKey === "Product Management"}
          onClick={() => handleClick("Product Management")}
        >
          <ListItemIcon>
            <Inventory2Icon />
          </ListItemIcon>
          <ListItemText primary="商品・在庫管理"></ListItemText>
        </ListItemButton>
      </List>
      <List>
        <ListItemButton onClick={() => handleClick("Order")} sx={hoverButton}>
          <ListItemIcon>
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText primary="受注管理"></ListItemText>
          {orderOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={orderOpen} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              ml: "20px",
              borderLeft: "3px solid #cfe0e6",
              backgroundColor: "rgba(17, 89, 111, 0.03)",
            }}
          >
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Search Order"}
              onClick={() => handleClick("Search Order")}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="受注検索" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Create Order"}
              onClick={() => handleClick("Create Order")}
            >
              <ListItemIcon>
                <PlaylistAddIcon />
              </ListItemIcon>
              <ListItemText primary="受注登録" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Upload Order"}
              onClick={() => handleClick("Upload Order")}
            >
              <ListItemIcon>
                <DocumentScannerIcon />
              </ListItemIcon>
              <ListItemText primary="受注アップロード（AI）" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Invoice Management"}
              onClick={() => handleClick("Invoice Management")}
            >
              <ListItemIcon>
                <ReceiptLongIcon />
              </ListItemIcon>
              <ListItemText primary="受注請求書管理" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
      <List>
        <ListItemButton onClick={() => handleClick("Supplier")} sx={hoverButton}>
          <ListItemIcon>
            <LocalShippingIcon />
          </ListItemIcon>
          <ListItemText primary="仕入れ管理"></ListItemText>
          {supplierOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={supplierOpen} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              ml: "20px",
              borderLeft: "3px solid #cfe0e6",
              backgroundColor: "rgba(17, 89, 111, 0.03)",
            }}
          >
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Search Supplier"}
              onClick={() => handleClick("Search Supplier")}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="仕入先検索/登録" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Search Purchase Order"}
              onClick={() => handleClick("Search Purchase Order")}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="発注検索/登録" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Upload Purchase Order"}
              onClick={() => handleClick("Upload Purchase Order")}
            >
              <ListItemIcon>
                <DocumentScannerIcon />
              </ListItemIcon>
              <ListItemText primary="発注アップロード（AI）" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Search Goods Receipt"}
              onClick={() => handleClick("Search Goods Receipt")}
            >
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="入荷検索/登録" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Upload Goods Receipt"}
              onClick={() => handleClick("Upload Goods Receipt")}
            >
              <ListItemIcon>
                <DocumentScannerIcon />
              </ListItemIcon>
              <ListItemText primary="入荷アップロード（AI）" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Reorder Suggestions"}
              onClick={() => handleClick("Reorder Suggestions")}
            >
              <ListItemIcon>
                <TipsAndUpdatesIcon />
              </ListItemIcon>
              <ListItemText primary="発注提案" />
            </ListItemButton>
            <ListItemButton
              sx={hoverChildButton}
              selected={activeKey === "Purchase Invoice Management"}
              onClick={() => handleClick("Purchase Invoice Management")}
            >
              <ListItemIcon>
                <ReceiptLongIcon />
              </ListItemIcon>
              <ListItemText primary="仕入請求書管理" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
      <List>
        <ListItemButton
          sx={hoverButton}
          selected={activeKey === "Sales Dashboard"}
          onClick={() => handleClick("Sales Dashboard")}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="経営ダッシュボード"></ListItemText>
        </ListItemButton>
      </List>
      <List>
        <ListItemButton
          sx={hoverButton}
          selected={activeKey === "Document Search"}
          onClick={() => handleClick("Document Search")}
        >
          <ListItemIcon>
            <SearchIcon />
          </ListItemIcon>
          <ListItemText primary="書類管理"></ListItemText>
        </ListItemButton>
      </List>
      <List>
        <ListItemButton
          sx={hoverButton}
          selected={activeKey === "Chat Assistant"}
          onClick={() => handleClick("Chat Assistant")}
        >
          <ListItemIcon>
            <SmartToyIcon />
          </ListItemIcon>
          <ListItemText primary="AIチャット"></ListItemText>
        </ListItemButton>
      </List>
      {isSuperAdmin && (
        <>
          <Divider sx={{ mt: 1 }} />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              pl: 2,
              pt: 1.5,
              pb: 0.5,
              color: "#8a97a0",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            設定
          </Typography>
          <List>
            <ListItemButton
              sx={hoverButton}
              onClick={() => navigate("/admin/templates")}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="テンプレート管理"></ListItemText>
            </ListItemButton>
          </List>
          <List>
            <ListItemButton
              sx={hoverButton}
              onClick={() => navigate("/admin/users")}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="ユーザー管理"></ListItemText>
            </ListItemButton>
          </List>
        </>
      )}
      {/* Footer (System Name) */}
      <div
        className="version-info"
        style={{
          padding: "12px 0px",
          borderTop: "1px solid #ccc",
          backgroundColor: AI_ACCENT_SOFT,
          textAlign: "center",
          color: AI_ACCENT_COLOR,
          fontWeight: "bold",
          fontSize: "1rem",
        }}
      >
        受注管理システム
      </div>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar sx={{ color: "#11596f", backgroundColor: "#fff" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 500,
                color: "#5b6b73",
              }}
            >
              {header}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
          <Box
            onMouseDown={handleResizeStart}
            sx={{
              display: { xs: "none", sm: "block" },
              position: "fixed",
              top: 0,
              left: drawerWidth - 3,
              width: "6px",
              height: "100vh",
              cursor: "col-resize",
              zIndex: (t) => t.zIndex.drawer + 1,
              "&:hover": { backgroundColor: "rgba(17, 89, 111, 0.3)" },
            }}
          />
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: "140px",
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          {header === "顧客情報の検索" && <CustomerSearch />}
          {header === "案件の検索" && <CaseSearch />}
          {header === "案件情報" && <CaseDetail caseId={caseId} />}
          {header === "書類管理" && <DocumentSearch />}
          {header === "受注検索" && <OrderSearch />}
          {header === "受注登録" && <OrderDetail orderId={undefined} />}
          {header === "受注アップロード（AI読み取り）" && <OrderIntakeUpload />}
          {header === "商品・在庫管理" && <ProductSearch />}
          {header === "仕入先検索" && <SupplierSearch />}
          {header === "発注検索" && <PurchaseOrderSearch />}
          {header === "発注アップロード（AI）" && <PurchaseOrderIntakeUpload />}
          {header === "入荷検索" && <GoodsReceiptSearch />}
          {header === "入荷アップロード（AI）" && <GoodsReceiptIntakeUpload />}
          {header === "発注提案" && <ReorderSuggestions />}
          {header === "仕入請求書管理" && <PurchaseInvoiceSearch />}
          {header === "受注請求書管理" && <InvoiceSearch />}
          {header === "経営ダッシュボード" && <SalesDashboard />}
          {header === "AIチャット" && <ChatAssistant />}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Sidebar;
