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
import GoodsReceiptDetail from "./GoodsReceiptDetail.js";
import goodsReceiptService from "../services/goodsReceiptService";
import supplierService from "../services/supplierService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const GoodsReceiptSearch = () => {
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [goodsReceiptId, setGoodsReceiptId] = useState();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(null);
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

  const getGoodsReceipts = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await goodsReceiptService
      .getAll(
        axiosPrivate,
        null,
        supplierId,
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
    setGoodsReceiptId(id);
    setShowDialog(true);
  };

  const handleClickSearch = async (e) => {
    await getGoodsReceipts(e);
    setShowList(true);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getGoodsReceipts(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getGoodsReceipts(e);
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
                <TableCell style={{ textAlign: "center" }}>入荷番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>発注番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>仕入先</TableCell>
                <TableCell style={{ textAlign: "center" }}>入荷日</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.goodsReceiptNumber}</TableCell>
                    <TableCell>{item.purchaseOrderNumber}</TableCell>
                    <TableCell>{item.supplierName}</TableCell>
                    <TableCell>
                      {item.receivedDate ? item.receivedDate.slice(0, 10) : ""}
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
                  <TableCell colSpan={5}>
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
        <Grid item xs={12} sm={6} md={4}>
          <div className="section-item" style={{ minWidth: 220 }}>
            <label className="section-label">仕入先</label>
            <FormSelection
              value={suppliers.find((s) => s.id === supplierId) || null}
              options={suppliers}
              optionSelected={(e, value) => setSupplierId(value ? value.id : null)}
            />
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className="handle-button">
            <FormButton itemName="検索" onClick={handleClickSearch} />
            <FormButton
              itemName="新規入荷"
              onClick={() => {
                setGoodsReceiptId(undefined);
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
        <GoodsReceiptDetail goodsReceiptId={goodsReceiptId}></GoodsReceiptDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default GoodsReceiptSearch;
