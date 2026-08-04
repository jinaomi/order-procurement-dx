import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormButton from "./until/FormButton";
import FormSelection from "./until/FormSelection";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import Pagination from "./until/Pagination";
import commonState from "../stories/commonState.ts";
import commonActions from "../actions/commonAction.ts";
import {
  Button,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ContentDialog from "./until/ContentDialog.js";
import PurchaseInvoiceDetail from "./PurchaseInvoiceDetail.js";
import purchaseInvoiceService from "../services/purchaseInvoiceService";
import supplierService from "../services/supplierService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const statusColor = { Recorded: "info", Paid: "success" };
const statusLabel = { Recorded: "記録済み", Paid: "支払済み" };
const statusOptions = [
  { id: "Recorded", label: "記録済み" },
  { id: "Paid", label: "支払済み" },
];

const PurchaseInvoiceSearch = () => {
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [purchaseInvoiceId, setPurchaseInvoiceId] = useState();
  const [suppliers, setSuppliers] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    supplierId: null,
    status: null,
    purchaseInvoiceNumber: "",
    issueDateFrom: "",
    issueDateTo: "",
  });
  const axiosPrivate = useAxiosPrivate();
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  useEffect(async () => {
    try {
      const supplierResponse = await supplierService.list(axiosPrivate);
      setSuppliers(supplierResponse.data || []);
    } catch (error) {
      setSuppliers([]);
    }
  }, []);

  const getPurchaseInvoices = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await purchaseInvoiceService
      .getAll(
        axiosPrivate,
        searchCriteria.supplierId,
        searchCriteria.status,
        searchCriteria.purchaseInvoiceNumber || null,
        searchCriteria.issueDateFrom || null,
        searchCriteria.issueDateTo || null,
        commonState.paginationState.pageSize,
        commonState.paginationState.currentPage
      )
      .then((response) => {
        setListItem(response.data);
        commonActions.setPaginationState({
          ...commonState.paginationState,
          totalCount: response.data.totalCount,
        });
      })
      .catch(() => {
        setListItem({ items: [] });
      });
    setLoading(false);
  };

  const handleClickDetail = (id) => {
    setPurchaseInvoiceId(id);
    setShowDialog(true);
  };

  const handleClickSearch = async (e) => {
    await getPurchaseInvoices(e);
    setShowList(true);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getPurchaseInvoices(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getPurchaseInvoices(e);
  };

  const closeDialog = (e) => {
    setShowDialog(false);
    handleClickSearch(e);
  };

  const Results = () => {
    let totalCount = 0;
    if (commonState.paginationState && commonState.paginationState.totalCount > 0) {
      totalCount = Math.ceil(
        commonState.paginationState.totalCount / commonState.paginationState.pageSize
      );
    }
    return (
      <>
        <Pagination
          totalCount={totalCount}
          pageSize={commonState.paginationState.pageSize}
          currentPage={commonState.paginationState.currentPage}
          handleChangePageSize={handleChangePageSize}
          handleChangePage={handleChangePage}
        />
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell style={{ textAlign: "center" }}>仕入請求書番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>発注番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>仕入先</TableCell>
                <TableCell style={{ textAlign: "center" }}>発行日</TableCell>
                <TableCell style={{ textAlign: "center" }}>支払期日</TableCell>
                <TableCell style={{ textAlign: "center" }}>合計金額</TableCell>
                <TableCell style={{ textAlign: "center" }}>ステータス</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.purchaseInvoiceNumber}</TableCell>
                    <TableCell>{item.purchaseOrderNumber}</TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell>{item.issueDate ? item.issueDate.slice(0, 10) : ""}</TableCell>
                    <TableCell>{item.dueDate ? item.dueDate.slice(0, 10) : ""}</TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      {item.totalAmount != null ? item.totalAmount.toLocaleString() : ""}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      <Chip
                        label={statusLabel[item.status] || item.status}
                        color={statusColor[item.status] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Icons.Visibility />}
                        onClick={() => handleClickDetail(item.id)}
                        style={{ margin: "1px 5px" }}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>
                    <span style={{ color: "#000" }}>表示する項目がありません。</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <section>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Grid container columnSpacing={5} rowSpacing={3}>
            <Grid item xs={12} sm={4} md={4}>
              <div className="section-item">
                <label className="section-label">仕入先</label>
                <FormSelection
                  value={suppliers.find((s) => s.id === searchCriteria.supplierId) || null}
                  options={suppliers}
                  optionSelected={(e, value) =>
                    setSearchCriteria((v) => ({ ...v, supplierId: value ? value.id : null }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <div className="section-item">
                <label className="section-label">ステータス</label>
                <FormSelection
                  value={statusOptions.find((s) => s.id === searchCriteria.status) || null}
                  options={statusOptions}
                  optionSelected={(e, value) =>
                    setSearchCriteria((v) => ({ ...v, status: value ? value.id : null }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <div className="section-item">
                <label className="section-label">仕入請求書番号</label>
                <input
                  type="text"
                  className="section-input"
                  placeholder="PINV-2026-00017"
                  value={searchCriteria.purchaseInvoiceNumber}
                  onChange={(e) =>
                    setSearchCriteria((v) => ({ ...v, purchaseInvoiceNumber: e.target.value }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12}>
              <div className="section-item">
                <label className="section-label">発行日</label>
                <div className="section-range" style={{ justifyContent: "flex-start", gap: "12px" }}>
                  <input
                    type="date"
                    className="section-input"
                    style={{ width: "auto", flex: "0 0 auto" }}
                    value={searchCriteria.issueDateFrom}
                    onChange={(e) =>
                      setSearchCriteria((v) => ({ ...v, issueDateFrom: e.target.value }))
                    }
                  />
                  <span>〜</span>
                  <input
                    type="date"
                    className="section-input"
                    style={{ width: "auto", flex: "0 0 auto" }}
                    value={searchCriteria.issueDateTo}
                    min={searchCriteria.issueDateFrom || undefined}
                    onChange={(e) =>
                      setSearchCriteria((v) => ({ ...v, issueDateTo: e.target.value }))
                    }
                  />
                </div>
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <div className="handle-button">
            <FormButton itemName="検索" onClick={handleClickSearch} />
            <FormButton
              itemName="新規仕入請求書"
              onClick={() => {
                setPurchaseInvoiceId(undefined);
                setShowDialog(true);
              }}
            />
          </div>
        </Grid>
        {showList ? (
          <Grid item xs={12}>
            <Results />
          </Grid>
        ) : null}
      </Grid>

      <LoadingSpinner loading={loading}></LoadingSpinner>
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <PurchaseInvoiceDetail purchaseInvoiceId={purchaseInvoiceId}></PurchaseInvoiceDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default PurchaseInvoiceSearch;
