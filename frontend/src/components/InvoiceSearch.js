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
import invoiceService from "../services/invoiceService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const statusColor = {
  Draft: "default",
  Issued: "info",
  Paid: "success",
  Overdue: "error",
};

const statusLabel = {
  Draft: "下書き",
  Issued: "発行済み",
  Paid: "入金済み",
  Overdue: "期限超過",
};

const statusOptions = [
  { id: "Issued", label: "発行済み" },
  { id: "Paid", label: "入金済み" },
];

const InvoiceSearch = () => {
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    customerId: null,
    status: null,
    orderNumber: "",
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
      const customerResponse = await axiosPrivate.get(
        "/api/Customer/getAll?pageSize=1000&pageNumber=1"
      );
      setCustomers(customerResponse.data.items || []);
    } catch (error) {
      setCustomers([]);
    }
  }, []);

  const getInvoices = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await invoiceService
      .getAll(
        axiosPrivate,
        searchCriteria.customerId,
        searchCriteria.status,
        searchCriteria.orderNumber || null,
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

  const handleClickSearch = async (e) => {
    await getInvoices(e);
    setShowList(true);
  };

  const handleDownload = async (invoice) => {
    setLoading(true);
    try {
      const response = await invoiceService.download(axiosPrivate, invoice.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "請求書のダウンロードに失敗しました。",
      });
    }
    setLoading(false);
  };

  const handleMarkPaid = async (invoice) => {
    setLoading(true);
    try {
      await invoiceService.updateStatus(axiosPrivate, invoice.id, "Paid");
      await getInvoices();
      setSnackbar({ isOpen: true, status: "success", message: "入金済みに更新しました。" });
    } catch (error) {
      setSnackbar({ isOpen: true, status: "error", message: "更新に失敗しました。" });
    }
    setLoading(false);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getInvoices(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getInvoices(e);
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
                <TableCell style={{ textAlign: "center" }}>請求書番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>受注番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>取引先</TableCell>
                <TableCell style={{ textAlign: "center" }}>発行日</TableCell>
                <TableCell style={{ textAlign: "center" }}>合計金額</TableCell>
                <TableCell style={{ textAlign: "center" }}>ステータス</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.invoiceNumber}</TableCell>
                    <TableCell>{item.orderNumber}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{item.issueDate ? item.issueDate.slice(0, 10) : ""}</TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      {item.totalAmount != null ? item.totalAmount.toLocaleString() : ""}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      <Chip label={statusLabel[item.status] || item.status} color={statusColor[item.status] || "default"} size="small" />
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Icons.Download />}
                        onClick={() => handleDownload(item)}
                        style={{ margin: "1px 5px" }}
                      >
                        PDF
                      </Button>
                      {item.status !== "Paid" && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<Icons.Paid />}
                          style={{ margin: "1px 5px" }}
                          onClick={() => handleMarkPaid(item)}
                        >
                          入金済みにする
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
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
                <label className="section-label">取引先</label>
                <FormSelection
                  value={
                    customers.find((c) => c.id === searchCriteria.customerId) || null
                  }
                  options={customers}
                  optionSelected={(e, value) =>
                    setSearchCriteria((v) => ({
                      ...v,
                      customerId: value ? value.id : null,
                    }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <div className="section-item">
                <label className="section-label">ステータス</label>
                <FormSelection
                  value={
                    statusOptions.find((s) => s.id === searchCriteria.status) || null
                  }
                  options={statusOptions}
                  optionSelected={(e, value) =>
                    setSearchCriteria((v) => ({
                      ...v,
                      status: value ? value.id : null,
                    }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <div className="section-item">
                <label className="section-label">受注番号</label>
                <input
                  type="text"
                  className="section-input"
                  placeholder="ORD-2026-00001"
                  value={searchCriteria.orderNumber}
                  onChange={(e) =>
                    setSearchCriteria((v) => ({ ...v, orderNumber: e.target.value }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12}>
              <div className="section-item">
                <label className="section-label">発行日</label>
                <div
                  className="section-range"
                  style={{ justifyContent: "flex-start", gap: "12px" }}
                >
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
          </div>
        </Grid>
        {showList ? (
          <Grid item xs={12}>
            <Results />
          </Grid>
        ) : null}
      </Grid>

      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default InvoiceSearch;
