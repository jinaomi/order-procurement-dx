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
import InsightsIcon from "@mui/icons-material/Insights";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { Collapse } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
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
import useAuth from "../hooks/useAuth";

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 64;

const NAV_GROUPS = [
  {
    key: "Master",
    label: "マスタ管理",
    icon: <BusinessCenterIcon />,
    items: [
      { key: "Customer", label: "顧客情報管理", icon: <BusinessIcon /> },
      { key: "Product Management", label: "商品・在庫管理", icon: <Inventory2Icon /> },
      { key: "Search Supplier", label: "仕入先検索/登録", icon: <SearchIcon /> },
    ],
  },
  {
    key: "Order",
    label: "受注管理",
    icon: <ShoppingCartIcon />,
    items: [
      { key: "Search Order", label: "受注検索", icon: <SearchIcon /> },
      { key: "Create Order", label: "受注登録", icon: <PlaylistAddIcon /> },
      { key: "Upload Order", label: "受注アップロード（AI）", icon: <DocumentScannerIcon /> },
      { key: "Invoice Management", label: "受注請求書管理", icon: <ReceiptLongIcon /> },
    ],
  },
  {
    key: "Purchase",
    label: "仕入れ管理",
    icon: <LocalShippingIcon />,
    items: [
      { key: "Search Purchase Order", label: "発注検索/登録", icon: <SearchIcon /> },
      { key: "Upload Purchase Order", label: "発注アップロード（AI）", icon: <DocumentScannerIcon /> },
      { key: "Search Goods Receipt", label: "入荷検索/登録", icon: <SearchIcon /> },
      { key: "Upload Goods Receipt", label: "入荷アップロード（AI）", icon: <DocumentScannerIcon /> },
      { key: "Reorder Suggestions", label: "発注提案", icon: <TipsAndUpdatesIcon /> },
      { key: "Purchase Invoice Management", label: "仕入請求書管理", icon: <ReceiptLongIcon /> },
    ],
  },
  {
    key: "Reports",
    label: "レポート・ツール",
    icon: <InsightsIcon />,
    items: [
      { key: "Sales Dashboard", label: "経営ダッシュボード", icon: <DashboardIcon /> },
      { key: "Document Search", label: "書類管理", icon: <SearchIcon /> },
      { key: "Chat Assistant", label: "AIチャット", icon: <SmartToyIcon /> },
    ],
  },
];

const Sidebar = () => {
  const theme = useTheme();
  const [collapsed, setCollapsed] = React.useState(
    () => localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [caseOpen, setCaseOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState({
    Master: false,
    Order: false,
    Purchase: false,
    Reports: false,
  });
  const [header, setHeader] = React.useState();
  const [activeKey, setActiveKey] = React.useState(null);
  const [caseId, setCaseDetail] = React.useState("");
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isSuperAdmin = auth?.roles?.includes("SuperAdmin");

  React.useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  }, [collapsed]);

  React.useEffect(() => {
    // Chuyển trang (đổi header) không tự cuộn về đầu — nếu trang trước đã
    // cuộn xuống, trang mới hiện ra sẽ bị cắt mất phần trên (tiêu đề/bộ lọc).
    window.scrollTo(0, 0);
  }, [header]);

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
        setGroupOpen((prev) => ({ ...prev, Order: !prev.Order }));
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
      case "Master":
        setGroupOpen((prev) => ({ ...prev, Master: !prev.Master }));
        break;
      case "Purchase":
        setGroupOpen((prev) => ({ ...prev, Purchase: !prev.Purchase }));
        break;
      case "Reports":
        setGroupOpen((prev) => ({ ...prev, Reports: !prev.Reports }));
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

  // "Case"/"Master"/"Order"/"Purchase"/"Reports" only expand/collapse their parent
  // menu — they don't map to an actual page, so they should never be marked "selected".
  const TOGGLE_ONLY_KEYS = ["Case", "Master", "Order", "Purchase", "Reports"];

  const handleClick = (item) => {
    setCaseDetail("");
    if (!TOGGLE_ONLY_KEYS.includes(item)) {
      setActiveKey(item);
    }
    mapPage(item);
  };

  const groupRefs = React.useRef({});

  const handleGroupClick = (groupKey, isCollapsedRail) => {
    if (isCollapsedRail) {
      setCollapsed(false);
    }
    const willOpen = !groupOpen[groupKey];
    handleClick(groupKey);
    if (willOpen) {
      // Scroll bar bên trong Drawer không tự cuộn khi menu vừa mở nằm ở
      // vị trí đã cuộn qua — đưa nút vừa bấm lên đầu vùng nhìn thấy để
      // các mục con mới hiện ra không bị cắt mất phần trên.
      requestAnimationFrame(() => {
        groupRefs.current[groupKey]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const hoverButton = {
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: "#fff",
    },
    "&:active": {
      backgroundColor: theme.palette.primary.dark,
    },
    "&:hover .MuiListItemIcon-root": {
      color: "#fff",
    },
    "&.Mui-selected, &.Mui-selected:hover": {
      backgroundColor: theme.palette.primary.main,
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

  const renderNav = (isCollapsedRail) => (
    <div>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsedRail ? "center" : "space-between",
          gap: 1.5,
          py: 1,
        }}
      >
        {!isCollapsedRail && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: theme.palette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
                <path
                  d="M14 24 H34 M34 24 L28 18 M34 24 L28 30"
                  stroke={theme.palette.secondary.main}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M50 40 H30 M30 40 L36 34 M30 40 L36 46"
                  stroke="#fff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: theme.palette.primary.main, lineHeight: 1.25 }}
            >
              受注・仕入
              <br />
              業務管理システム
            </Typography>
          </Box>
        )}
        {isCollapsedRail && (
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
            受
          </Avatar>
        )}
        {!isCollapsedRail && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            sx={{ display: { xs: "none", sm: "inline-flex" }, flexShrink: 0 }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      {isCollapsedRail && (
        <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: "center", py: 0.5 }}>
          <IconButton size="small" onClick={() => setCollapsed(false)}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
      {/* 案件管理 — ẩn theo yêu cầu, giữ code để bật lại sau này
      <List disablePadding>
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
              borderLeft: `3px solid ${theme.palette.divider}`,
              backgroundColor: "rgba(31, 58, 95, 0.03)",
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
      {NAV_GROUPS.map((group) => (
        <List key={group.key} disablePadding>
          <Tooltip title={isCollapsedRail ? group.label : ""} placement="right">
            <ListItemButton
              ref={(el) => (groupRefs.current[group.key] = el)}
              onClick={() => handleGroupClick(group.key, isCollapsedRail)}
              sx={{ ...hoverButton, justifyContent: isCollapsedRail ? "center" : "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: isCollapsedRail ? 0 : 40 }}>
                {group.icon}
              </ListItemIcon>
              {!isCollapsedRail && <ListItemText primary={group.label} />}
              {!isCollapsedRail && (groupOpen[group.key] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </Tooltip>
          <Collapse in={!isCollapsedRail && groupOpen[group.key]} timeout="auto" unmountOnExit>
            <List
              component="div"
              disablePadding
              sx={{
                ml: "20px",
                borderLeft: `3px solid ${theme.palette.divider}`,
                backgroundColor: "rgba(31, 58, 95, 0.03)",
              }}
            >
              {group.items.map((item) => (
                <ListItemButton
                  key={item.key}
                  sx={hoverChildButton}
                  selected={activeKey === item.key}
                  onClick={() => handleClick(item.key)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      ))}
      {isSuperAdmin && (
        <>
          <Divider sx={{ mt: 1 }} />
          {!isCollapsedRail && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                pl: 2,
                pt: 1.5,
                pb: 0.5,
                color: theme.palette.text.secondary,
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              設定
            </Typography>
          )}
          <List disablePadding>
            <Tooltip title={isCollapsedRail ? "テンプレート管理" : ""} placement="right">
              <ListItemButton
                sx={{ ...hoverButton, justifyContent: isCollapsedRail ? "center" : "flex-start" }}
                onClick={() => navigate("/admin/templates")}
              >
                <ListItemIcon sx={{ minWidth: isCollapsedRail ? 0 : 40 }}>
                  <SettingsIcon />
                </ListItemIcon>
                {!isCollapsedRail && <ListItemText primary="テンプレート管理" />}
              </ListItemButton>
            </Tooltip>
          </List>
          <List disablePadding>
            <Tooltip title={isCollapsedRail ? "ユーザー管理" : ""} placement="right">
              <ListItemButton
                sx={{ ...hoverButton, justifyContent: isCollapsedRail ? "center" : "flex-start" }}
                onClick={() => navigate("/admin/users")}
              >
                <ListItemIcon sx={{ minWidth: isCollapsedRail ? 0 : 40 }}>
                  <PeopleIcon />
                </ListItemIcon>
                {!isCollapsedRail && <ListItemText primary="ユーザー管理" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </>
      )}
    </div>
  );

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED}px)` },
          ml: { sm: `${collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
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
            sx={{ flexGrow: 1, fontWeight: 500 }}
          >
            {header}
          </Typography>
          <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} size="small">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              {auth?.username?.[0]?.toUpperCase() || "U"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
          >
            <MenuItem disabled>{auth?.username}</MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                logOut();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED },
          flexShrink: { sm: 0 },
        }}
        aria-label="mailbox folders"
      >
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
              width: DRAWER_WIDTH_EXPANDED,
            },
          }}
        >
          {renderNav(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED,
              overflowX: "hidden",
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {renderNav(collapsed)}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            sm: `calc(100% - ${collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED}px)`,
          },
        }}
      >
        <Toolbar />
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
  );
};

export default Sidebar;
