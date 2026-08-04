import { useState, useEffect } from "react";
import GenericItems from "./until/GenericItems";
import LoadingSpinner from "./until/LoadingSpinner";
import ConfirmDialog from "./until/ConfirmBox";
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
import Truncate from "./until/Truncate";
import FormButton from "./until/FormButton";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import caseSearchState from "../stories/caseSearchState.ts";
import caseSearchActions from "../actions/caseSearchActions.ts";
import ContentDialog from "./until/ContentDialog.js";
import CaseDetail from "./CaseDetail.js";
import * as Icons from "@mui/icons-material";
import FormSnackbar from "./until/FormSnackbar.js";

const CaseSearch = () => {
  const axiosPrivate = useAxiosPrivate();
  const controller = new AbortController();
  const [template, setTemplate] = useState([]);
  const [keyWordSearch, setKeyWordSearch] = useState([]);

  const [customerList, setCustomerList] = useState([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [caseIdClose, setCloseCase] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [caseId, setCaseId] = useState();
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
    caseSearchActions.setPaginationState(0, 10, 1);
    caseSearchActions.setKeywordsSearchState([]);
    caseSearchActions.setCaseDataSearchState([]);
    setShowList(false);
    setKeyWordSearch([]);
    await getCaseTemplate();
  }, []);

  const getCaseTemplate = async (e) => {
    // call API get template
    setLoading(true);
    let templateURL = "/api/Case/template";
    await axiosPrivate
      .get(templateURL, {
        signal: controller.signal,
      })
      .then((response) => {
        response.data.caseKeywordValues.forEach(function (item) {
          item.customerId = "";
        });
        response.data.customers.forEach(function (item) {
          item.label = item.name;
        });
        setCustomerList(response.data.customers);
        setTemplate(response.data.caseKeywordValues);
        setKeyWordSearch(response.data.caseKeywordValues);
      })
      .catch(() => {
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });

    setLoading(false);
  };

  const getCaseList = async (e) => {
    setLoading(true);
    e.preventDefault();
    const searchCaseUrl = "/api/Case/getAll";
    const payload = {
      keywordValues: keyWordSearch.filter((n) => !n.fromTo && n.value),
      keywordDateValues: keyWordSearch.filter(
        (n) => n.fromTo && (n.fromValue || n.toValue)
      ),
      pageSize: commonState.paginationState.pageSize,
      pageNumber: commonState.paginationState.currentPage,
    };
    let payloadFilterd = keyWordSearch.filter((n) => n.value);
    payload.keywordValues = payloadFilterd;
    setShowList(false);
    await axiosPrivate
      .post(searchCaseUrl, payload)
      .then((response) => {
        commonActions.setPaginationState({
          ...commonState.paginationState,
          totalCount: response.data.totalCount,
        });
        caseSearchActions.setCaseDataSearchState(response.data.items);
        setShowList(true);
      })
      .catch(() => {
        caseSearchActions.setCaseDataSearchState([]);
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
    setLoading(false);
  };

  const handleClickSearch = async (e) => {
    const hasConditions = keyWordSearch.some((n) => n.value || n.fromValue || n.toValue);
    if (!hasConditions) {
      setSnackbar({ isOpen: true, status: "error", message: "少なくとも1つの検索条件を入力してください。" });
      return;
    }
    await getCaseList(e);
  };

  const handleClear = () => {
    setKeyWordSearch((prevKeyWordSearch) =>
      prevKeyWordSearch.map((item) => ({
        ...item,
        value: "",
        fromValue: "",
        toValue: "",
        customerId: "",
      }))
    );
  };

  const handleClickEdit = (caseId) => {
    setLoading(true);
    setCaseId(caseId);
    // setHeader("Create Case");
    setShowDialog(true);
    setLoading(false);
  };

  const confirmCloseCase = async (e) => {
    setLoading(true);
    setShowAlert(false);
    e.preventDefault();

    const closeCaseUrl = `/api/Case/Close?caseId=${caseIdClose}`;
    const payload = {
      caseId: caseIdClose,
    };

    axiosPrivate
      .post(closeCaseUrl, payload)
      .then(async () => {
        await getCaseList(e);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "案件情報が正常に削除されました。",
        });
      })
      .catch((error) => {
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
    setLoading(false);
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getCaseList(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getCaseList(e);
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

    const convertItem = (item) => {
      if (item.keywordName === "取引先名") {
        return customerList.filter((a) => a.id === item.value)[0]?.name;
      } else return item.value;
    };

    return commonState.paginationState &&
      commonState.paginationState.totalCount > 0 ? (
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
                  案件番号
                </TableCell>
                {caseSearchState.caseDataSearchState.items[0].caseKeywordValues
                  .length > 0 &&
                  caseSearchState.caseDataSearchState.items[0].caseKeywordValues.map(
                    (item) => {
                      return (
                        item.isShowOnCaseList && (
                          <TableCell
                            key={item.keywordId}
                            style={{
                              textAlign: "center",
                              width: "fit-content",
                            }}
                          >
                            {item.keywordName}
                          </TableCell>
                        )
                      );
                    }
                  )}
                <TableCell style={{ textAlign: "center", width: "100px" }}>
                  操作
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {caseSearchState.caseDataSearchState.items.map((row) => (
                <TableRow
                  key={row.caseId}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>
                    <Truncate str={row.caseName} maxlength={15} />
                  </TableCell>
                  {row.caseKeywordValues
                    .filter((n) => n.isShowOnCaseList)
                    .map((item, index) => {
                      return (
                        <TableCell key={`${row.caseId}-${item.keywordName}`}>
                          <Truncate str={convertItem(item)} />
                        </TableCell>
                      );
                    })}
                  <TableCell
                    style={{
                      position: "relative",
                      width: "110px",
                      textAlign: "center",
                    }}
                  >
                    {row.caseKeywordValues
                      .filter((n) => n.isShowOnCaseList)
                      .map((item, index) => (
                        <div key={`${row.caseId}-${item.keywordName}-actions`}>
                          {index + 1 ===
                            row.caseKeywordValues.filter(
                              (n) => n.isShowOnCaseList
                            ).length && (
                            <>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Icons.Edit />}
                                onClick={() => {
                                  handleClickEdit(row.caseId);
                                }}
                                style={{ marginBottom: 5 }}
                              >
                                編集
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<Icons.Delete />}
                                onClick={() => {
                                  setShowAlert(true);
                                  setCloseCase(row.caseId);
                                }}
                              >
                                削除
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    ) : (
      <h3>表示する項目がありません。</h3>
    );
  };

  const handleGenerateCustomerName = (item, templateItem) => {
    if (templateItem.keywordName === "取引先名") {
      if (customerList.filter((a) => a.id === item.value)[0]?.name) {
        return customerList.filter((a) => a.id === item.value)[0]?.name;
      }
    }
    return item.value;
  };

  const dynamicGenerate = (item, templateItem) => {
    let typeValue = templateItem.typeValue;
    if (templateItem.fromTo) {
      typeValue = "daterange";
    } else if (templateItem.keywordName === "取引先名") {
      typeValue = "customerlist";
    }
    return (
      <GenericItems
        value={typeValue === "customerlist" ? (customerList.find(c => c.id === item.value) || null) : handleGenerateCustomerName(item, templateItem)}
        value1={item.fromValue}
        value2={item.toValue}
        label={templateItem.keywordName}
        type={typeValue}
        key={templateItem.order}
        handleInput={(e) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, value: e.target.value };
            } else return { ...value };
          });
          setKeyWordSearch(newState);
        }}
        // using for date range
        handleInput1={(e) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, fromValue: e.target.value };
            } else return { ...value };
          });

          setKeyWordSearch(newState);
        }}
        handleInput2={(e) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, toValue: e.target.value };
            } else return { ...value };
          });
          setKeyWordSearch(newState);
        }}
        handleInput3={(e) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, value: e.target.outerText };
            } else return { ...value };
          });
          setKeyWordSearch(newState);
        }}
        handleInputCustomer={(e, customer) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordName === "電話番号") {
              value.value =
                customer && customer.id
                  ? customerList.find((x) => x.id === customer.id).phoneNumber
                  : "";
            }
            if (value.keywordName === "住所") {
              let fiteredCustomer =
                customer && customer.id
                  ? customerList.find((x) => x.id === customer.id)
                  : "";
              value.value = fiteredCustomer
                ? [
                    fiteredCustomer.stateProvince,
                    fiteredCustomer.city,
                    fiteredCustomer.street,
                    fiteredCustomer.buildingName,
                    fiteredCustomer.roomNumber,
                  ].join("")
                : "";
            }
            if (value.keywordId === item.keywordId) {
              return {
                ...value,
                value: customer ? customer.id : "",
              };
            } else return { ...value };
          });
          setKeyWordSearch(newState);
        }}
        optionCustomers={customerList}
        options={item.metadata}
      />
    );
  };

  const generateCode = () => {
    template.sort((a, b) =>
      a.order > b.order ? 1 : b.order > a.order ? -1 : 0
    );
    const mid = (template.length + 1) / 2;
    return (
      <>
        <Grid item xs={6}>
          {template.map((templateItem, index) => {
            if (index + 1 <= mid) {
              return keyWordSearch.map((item) => {
                if (item.keywordId === templateItem.keywordId) {
                  return dynamicGenerate(item, templateItem);
                }
              });
            }
          })}
        </Grid>
        <Grid item xs={6}>
          {template.map((templateItem, index) => {
            if (index + 1 > mid) {
              return keyWordSearch.map((item) => {
                if (item.keywordId === templateItem.keywordId) {
                  return dynamicGenerate(item, templateItem);
                }
              });
            }
          })}
        </Grid>
      </>
    );
  };

  return (
    <section>
      <Grid container spacing={5}>
        {generateCode()}
        <Grid item xs={12}>
          <div className="handle-button">
            {/* Search and Clear Button */}
            <FormButton onClick={handleClickSearch} itemName="検索" />
            <FormButton onClick={handleClear} itemName="検索条件の初期化" />
          </div>
        </Grid>
      </Grid>
      {showList ? (
        <Grid item xs={12}>
          <Results />
        </Grid>
      ) : null}

      <LoadingSpinner loading={loading}></LoadingSpinner>
      <ConfirmDialog
        open={showAlert}
        closeDialog={() => setShowAlert(false)}
        handleFunction={confirmCloseCase}
        typeDialog="案件削除の確認"
      />
      <ContentDialog open={showDialog} closeDialog={(e) => closeDialog(e)}>
        <CaseDetail caseId={caseId} createType={false} />
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default CaseSearch;
