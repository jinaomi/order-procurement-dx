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
import OrderDetail from "./OrderDetail.js";
import orderService from "../services/orderService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const statusColor = {
  Draft: "default",
  Confirmed: "success",
  RiskFlagged: "warning",
  Invoiced: "info",
  Cancelled: "error",
};

const statusLabel = {
  Draft: "下書き",
  Confirmed: "確定",
  RiskFlagged: "リスクあり",
  Invoiced: "請求済み",
  Cancelled: "キャンセル",
};

const riskColor = {
  Sufficient: "success",
  Warning: "warning",
  Insufficient: "error",
};

const riskLabel = {
  Sufficient: "在庫十分",
  Warning: "要注意",
  Insufficient: "不足",
};

const OrderSearch = () => {
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ id: null, orderNumber: null });
  const [showDialog, setShowDialog] = useState(false);
  const [orderId, setOrderId] = useState();
  const [customers, setCustomers] = useState([]);
  const [searchCriteria, setSearchCriteria] = useState({
    customerId: null,
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
      const customerResponse = await axiosPrivate.get(
        "/api/Customer/getAll?pageSize=1000&pageNumber=1"
      );
      setCustomers(customerResponse.data.items || []);
    } catch (error) {
      setCustomers([]);
    }
  }, []);

  const getOrders = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await orderService
      .getAll(
        axiosPrivate,
        null,
        searchCriteria.customerId,
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
    setOrderId(id);
    setShowDialog(true);
  };

  const handleClickDelete = async (e) => {
    setLoading(true);
    e.preventDefault();
    await orderService
      .deleteById(axiosPrivate, deleteItem.id)
      .then(async () => {
        setShowAlert(false);
        await getOrders(e);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "受注情報が正常に削除されました。",
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
    await getOrders(e);
    setShowList(true);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getOrders(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getOrders(e);
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
                <TableCell style={{ textAlign: "center" }}>受注番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>取引先</TableCell>
                <TableCell style={{ textAlign: "center" }}>受注日</TableCell>
                <TableCell style={{ textAlign: "center" }}>合計金額</TableCell>
                <TableCell style={{ textAlign: "center" }}>ステータス</TableCell>
                <TableCell style={{ textAlign: "center" }}>AI照合</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.orderNumber}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
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
                      {item.riskLevel ? (
                        <Chip
                          label={riskLabel[item.riskLevel] || item.riskLevel}
                          color={riskColor[item.riskLevel] || "default"}
                          size="small"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Icons.Edit />}
                        onClick={() => handleClickEdit(item.id)}
                        style={{ margin: "1px 5px" }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
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
            <Grid item xs={12} sm={5} md={3}>
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
            <Grid item xs={12} sm={12} md={7}>
              <div className="section-item">
                <label className="section-label">受注日</label>
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
              itemName="新規受注"
              onClick={() => {
                setOrderId(undefined);
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
        item={deleteItem.orderNumber}
        handleFunction={handleClickDelete}
        typeDialog="削除確認"
        mainContent="この受注を削除しますか？"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <OrderDetail orderId={orderId}></OrderDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default OrderSearch;
