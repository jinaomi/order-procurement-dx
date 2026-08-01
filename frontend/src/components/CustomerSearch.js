import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import Truncate from "./until/Truncate";
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
import CustomerDetail from "./CustomerDetail.js";

import * as Icons from "@mui/icons-material";
import "../styles/styles.css";
import FormSnackbar from "./until/FormSnackbar.js";

const CustomerSearch = () => {
  const [data, setData] = useState({});
  const [showList, setShowList] = useState(false);
  const [listItem, setListItem] = useState([
    { id: null, customerName: null, phoneNumber: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [deleteItem, setDeleteItem] = useState({
    id: null,
    name: null,
    phoneNumber: null,
  });
  const [showDialog, setShowDialog] = useState(false);
  const [customerId, setCustomerId] = useState();
  const axiosPrivate = useAxiosPrivate();
  const controller = new AbortController();
  // State for phone number error
  const [phoneNumberError, setPhoneNumberError] = useState(undefined);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  useEffect(async () => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      totalCount: 0,
    });
  }, []);

  const getCustomers = async (e) => {
    setLoading(true);
    e.preventDefault();
    let searchURL = "/api/Customer/getAll";
    let pagination = `pageSize=${commonState.paginationState.pageSize}&pageNumber=${commonState.paginationState.currentPage}`;
    if (data.customerName && data.phoneNumber) {
      searchURL =
        searchURL +
        `?customerName=${data.customerName}&phoneNumber=${data.phoneNumber}&${pagination}`;
    } else if (data.phoneNumber) {
      searchURL = searchURL + `?phoneNumber=${data.phoneNumber}&${pagination}`;
    } else if (data.customerName) {
      searchURL =
        searchURL + `?customerName=${data.customerName}&${pagination}`;
    } else {
      searchURL = searchURL + `?${pagination}`;
    }

    const status = await axiosPrivate
      .get(searchURL, {
        signal: controller.signal,
        validateStatus: () => true,
      })
      .then((response) => {
        setListItem(response.data);
        commonActions.setPaginationState({
          ...commonState.paginationState,
          totalCount: response.data.totalCount,
        });
      })
      .catch(() => {
        setListItem([]);
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
    if (status == 404) {
      setListItem([]);
    }
    setLoading(false);
  };

  const handleClickEdit = (id) => {
    setLoading(true);
    setCustomerId(id);
    setShowDialog(true);
    setLoading(false);
  };

  const handleClickDelete = async (e) => {
    setLoading(true);
    e.preventDefault();
    var deleteURL = "/api/Customer/" + deleteItem.id;
    await axiosPrivate
      .delete(deleteURL)
      .then(async (res) => {
        setShowAlert(false);
        await getCustomers(e);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "取引先情報が正常に削除されました。",
        });
        setShowList(true);
      })
      .catch((error) => {
        if (
          error.response.data ===
          "You can't delete this customer because it is still used in one open case."
        ) {
          setSnackbar({
            isOpen: true,
            status: "error",
            message:
              "この取引先はまだ進行中の案件が存在しているため、削除できません。",
          });
        } else {
          setSnackbar({
            isOpen: true,
            status: "error",
            message:
              "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
          });
        }
      });
    setLoading(false);
  };

  const handleClickSearch = async (e) => {
    await getCustomers(e);
    setShowList(true);
  };

  const handleChange = (event, item) => {
    if (item === "customerName") {
      setData({ ...data, customerName: event.target.value });
    } else {
      // Display a message if hyphens are detected in 電話番号 field
      if (event.target.value.includes("-")) {
        setPhoneNumberError("「-」ハイフンを除いて番号のみ");
      } else {
        // Clear the error message if no hyphens
        setPhoneNumberError(undefined);
      }
      setData({ ...data, phoneNumber: event.target.value });
    }
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getCustomers(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getCustomers(e);
  };

  const closeDialog = (e) => {
    setShowDialog(false);
    handleClickSearch(e);
  };

  const Results = () => {
    let totalCount = 0;
    if (
      commonState.paginationState &&
      commonState.paginationState.totalCount > 0
    ) {
      totalCount = Math.ceil(
        commonState.paginationState.totalCount /
          commonState.paginationState.pageSize
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
                <TableCell
                  style={{ textAlign: "center", width: "fit-content" }}
                >
                  取引先名
                </TableCell>
                <TableCell
                  style={{ textAlign: "center", width: "fit-content" }}
                >
                  電話番号
                </TableCell>
                <TableCell
                  style={{ textAlign: "center", width: "fit-content" }}
                >
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listItem && listItem.items && listItem.items.length > 0 ? (
                listItem.items.map((item) => {
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Truncate str={item.name} maxLength={20} />
                      </TableCell>
                      <TableCell>
                        <Truncate str={item.phoneNumber} maxLength={20} />
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
                  );
                })
              ) : (
                <TableCell colSpan={3}>
                  <span style={{ color: "#000" }}>
                    表示する項目がありません。
                  </span>
                </TableCell>
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
            <label className="section-label">取引先名</label>
            <input
              value={data.customerName}
              className="section-input"
              type="text"
              onChange={(e) => handleChange(e, "customerName")}
            ></input>
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className="section-item">
            <label className="section-label">電話番号</label>
            <input
              value={data.phoneNumber}
              className="section-input"
              type="text"
              maxLength={11}
              onChange={(e) => handleChange(e, "phoneNumber")}
            />
            {/* Display phone number error message */}
            {phoneNumberError && (
              <span style={{ color: "red" }}>{phoneNumberError}</span>
            )}
          </div>
        </Grid>
        <br />
        <Grid item xs={12}>
          <div className="handle-button">
            {/* Search Button */}
            <FormButton itemName="検索" onClick={handleClickSearch} />
            <FormButton
              itemName="新規登録"
              onClick={() => {
                setCustomerId(undefined);
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
        mainContent="顧客情報を削除すると、電話番号情報、住所などの情報がすべて失われます。本当に削除しますか？"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <CustomerDetail customerId={customerId}></CustomerDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default CustomerSearch;
