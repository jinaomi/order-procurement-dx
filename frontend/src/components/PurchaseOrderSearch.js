import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import ConfirmDialog from "./until/ConfirmBox";
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
import PurchaseOrderDetail from "./PurchaseOrderDetail.js";
import purchaseOrderService from "../services/purchaseOrderService";
import supplierService from "../services/supplierService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const statusColor = {
  Draft: "default",
  Confirmed: "success",
  PartiallyReceived: "warning",
  Received: "info",
  Cancelled: "error",
};

const statusLabel = {
  Draft: "下書き",
  Confirmed: "確定",
  PartiallyReceived: "一部入荷済み",
  Received: "入荷済み",
  Cancelled: "キャンセル",
};

const PurchaseOrderSearch = () => {
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ id: null, purchaseOrderNumber: null });
  const [showDialog, setShowDialog] = useState(false);
  const [purchaseOrderId, setPurchaseOrderId] = useState();
  const [suppliers, setSuppliers] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    supplierId: null,
    orderDateFrom: "",
    orderDateTo: "",
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

  const getPurchaseOrders = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await purchaseOrderService
      .getAll(
        axiosPrivate,
        null,
        searchCriteria.supplierId,
        searchCriteria.orderDateFrom || null,
        searchCriteria.orderDateTo || null,
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

  const handleClickEdit = (id) => {
    setPurchaseOrderId(id);
    setShowDialog(true);
  };

  const handleClickDelete = async (e) => {
    setLoading(true);
    e.preventDefault();
    await purchaseOrderService
      .deleteById(axiosPrivate, deleteItem.id)
      .then(async () => {
        setShowAlert(false);
        await getPurchaseOrders(e);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "発注情報が正常に削除されました。",
        });
      })
      .catch(() => {
        setSnackbar({
          isOpen: true,
          status: "error",
          message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
    setLoading(false);
  };

  const handleClickSearch = async (e) => {
    await getPurchaseOrders(e);
    setShowList(true);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getPurchaseOrders(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getPurchaseOrders(e);
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
                <TableCell style={{ textAlign: "center" }}>発注番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>仕入先</TableCell>
                <TableCell style={{ textAlign: "center" }}>発注日</TableCell>
                <TableCell style={{ textAlign: "center" }}>合計金額</TableCell>
                <TableCell style={{ textAlign: "center" }}>ステータス</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.purchaseOrderNumber}</TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell>
                      {item.orderDate ? item.orderDate.slice(0, 10) : ""}
                    </TableCell>
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
                        startIcon={<Icons.Edit />}
                        onClick={() => handleClickEdit(item.id)}
                        style={{ margin: "1px 5px" }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Icons.Delete />}
                        style={{ margin: "1px 5px" }}
                        onClick={() => {
                          setShowAlert(true);
                          setDeleteItem(item);
                        }}
                      >
                        削除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
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
            <Grid item xs={12} sm={5} md={3}>
              <div className="section-item">
                <label className="section-label">仕入先</label>
                <FormSelection
                  value={
                    suppliers.find((s) => s.id === searchCriteria.supplierId) || null
                  }
                  options={suppliers}
                  optionSelected={(e, value) =>
                    setSearchCriteria((v) => ({
                      ...v,
                      supplierId: value ? value.id : null,
                    }))
                  }
                />
              </div>
            </Grid>
            <Grid item xs={12} sm={12} md={7}>
              <div className="section-item">
                <label className="section-label">発注日</label>
                <div className="section-range">
                  <input
                    type="date"
                    className="section-input"
                    style={{ width: "auto", flex: "0 0 auto" }}
                    value={searchCriteria.orderDateFrom}
                    onChange={(e) =>
                      setSearchCriteria((v) => ({ ...v, orderDateFrom: e.target.value }))
                    }
                  />
                  <span>〜</span>
                  <input
                    type="date"
                    className="section-input"
                    style={{ width: "auto", flex: "0 0 auto" }}
                    value={searchCriteria.orderDateTo}
                    min={searchCriteria.orderDateFrom || undefined}
                    onChange={(e) =>
                      setSearchCriteria((v) => ({ ...v, orderDateTo: e.target.value }))
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
              itemName="新規発注"
              onClick={() => {
                setPurchaseOrderId(undefined);
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
      <ConfirmDialog
        open={showAlert}
        closeDialog={() => setShowAlert(false)}
        item={deleteItem.purchaseOrderNumber}
        handleFunction={handleClickDelete}
        typeDialog="削除確認"
        mainContent="この発注を削除しますか？"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <PurchaseOrderDetail purchaseOrderId={purchaseOrderId}></PurchaseOrderDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default PurchaseOrderSearch;
