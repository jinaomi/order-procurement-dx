import { useState } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import ConfirmDialog from "./until/ConfirmBox";
import FormButton from "./until/FormButton";
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
import SupplierDetail from "./SupplierDetail.js";
import supplierService from "../services/supplierService";
import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const SupplierSearch = () => {
  const [name, setName] = useState("");
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteItem, setDeleteItem] = useState({ id: null, name: null });
  const [showDialog, setShowDialog] = useState(false);
  const [supplierId, setSupplierId] = useState();
  const axiosPrivate = useAxiosPrivate();
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  const getSuppliers = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    await supplierService
      .getAll(
        axiosPrivate,
        name,
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
    setSupplierId(id);
    setShowDialog(true);
  };

  const handleClickDelete = async (e) => {
    setLoading(true);
    e.preventDefault();
    await supplierService
      .deleteById(axiosPrivate, deleteItem.id)
      .then(async () => {
        setShowAlert(false);
        await getSuppliers(e);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "仕入先情報が正常に削除されました。",
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
    await getSuppliers(e);
    setShowList(true);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getSuppliers(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getSuppliers(e);
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
                <TableCell style={{ textAlign: "center" }}>仕入先名</TableCell>
                <TableCell style={{ textAlign: "center" }}>担当者名</TableCell>
                <TableCell style={{ textAlign: "center" }}>電話番号</TableCell>
                <TableCell style={{ textAlign: "center" }}>支払サイト</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.contactName}</TableCell>
                    <TableCell>{item.phoneNumber}</TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      {item.paymentCycleMonths}ヶ月後 / {item.paymentDay === 99 ? "月末" : `${item.paymentDay}日`}
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
        <Grid item xs={6}>
          <div className="section-item">
            <label className="section-label">仕入先名</label>
            <input
              value={name}
              className="section-input"
              type="text"
              onChange={(e) => setName(e.target.value)}
            ></input>
          </div>
        </Grid>
        <Grid item xs={12}>
          <div className="handle-button">
            <FormButton itemName="検索" onClick={handleClickSearch} />
            <FormButton
              itemName="新規仕入先"
              onClick={() => {
                setSupplierId(undefined);
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
        item={deleteItem.name}
        handleFunction={handleClickDelete}
        typeDialog="削除確認"
        mainContent="この仕入先を削除しますか？"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <SupplierDetail supplierId={supplierId}></SupplierDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default SupplierSearch;
