import LoadingSpinner from "../until/LoadingSpinner.js";
import Truncate from "../until/Truncate.js";
import useAxiosPrivate from "../../hooks/useAxiosPrivate.js";
import ConfirmDialog from "../until/ConfirmBox.js";
import { useState, useEffect } from "react";
import FormButton from "../until/FormButton.js";
import Pagination from "../until/Pagination.js";
import GenericItems from "../until/GenericItems.js";
import ContentDialog from "../until/ContentDialog.js";
import commonState from "../../stories/commonState.ts";
import commonActions from "../../actions/commonAction.ts";
import * as _ from "lodash";
import {
  Button,
  Checkbox,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import * as Icons from "@mui/icons-material";
import CaseDetail from "../CaseDetail.js";
import PurchaseOrderDetail from "../PurchaseOrderDetail.js";
import GoodsReceiptDetail from "../GoodsReceiptDetail.js";
import PurchaseInvoiceDetail from "../PurchaseInvoiceDetail.js";
import FormSnackbar from "../until/FormSnackbar.js";

const entityTypeLabel = {
  Case: "案件",
  PurchaseOrder: "発注書",
  GoodsReceipt: "入荷",
  PurchaseInvoice: "仕入請求書",
};

const DocumentSearch = () => {
  const [showList, setShowList] = useState(true);
  const [listItem, setListItem] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [template, setTemplate] = useState([]);
  const [keyWordSearch, setKeyWordSearch] = useState([]);
  const [fileTypeSearch, setFileTypeSearch] = useState({
    fileTypes: [],
    name: "File Type",
    value: null,
    label: "",
  });
  const [customerList, setCustomerList] = useState([]);
  const [deleteItem, setDeleteItem] = useState({
    keywordId: null,
    caseId: null,
    fileName: "",
  });
  const axiosPrivate = useAxiosPrivate();
  const controller = new AbortController();
  const [urlPreviewImg, setUrlPreviewImg] = useState({
    blobUrl: "",
    fileName: "",
  });
  const [showDialog, setShowDialog] = useState(false);
  const [showDialogPreview, setShowDialogPreview] = useState(false);

  const [showDialogCase, setShowDialogCase] = useState(false);
  const [viewTarget, setViewTarget] = useState({ entityType: "Case", entityId: null });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = useState(false);
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
    setListItem([]);
    setUrlPreviewImg({ blobUrl: "", fileName: "" });
    await getDocumentTemplate();
  }, []);

  const getFiles = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    let searchURL = "/api/Document/search";
    const keywordSearchCopy = _.cloneDeep(keyWordSearch);
    const keywordValues = keywordSearchCopy.filter((x) => !x.fromTo && x.value);
    let keywordDateValues = keyWordSearch.filter(
      (x) =>
        x.fromTo && x.typeValue === "datetime" && (x.fromValue || x.toValue)
    );
    let keywordDecimalValues = keyWordSearch.filter(
      (x) => x.fromTo && x.typeValue === "decimal" && (x.fromValue || x.toValue)
    );
    keywordValues.forEach((item) => {
      if (item.keywordName === "取引先名") {
        item.value = item.customerId;
      }
    });
    const payload = {
      fileTypeId: fileTypeSearch.value,
      keywordValues: keywordValues,
      keywordDateValues: keywordDateValues,
      keywordDecimalValues: keywordDecimalValues,
      pageSize: commonState.paginationState.pageSize,
      pageNumber: commonState.paginationState.currentPage,
    };
    const status = await axiosPrivate
      .post(searchURL, payload, {
        signal: controller.signal,
        validateStatus: () => true,
      })
      .then((response) => {
        setListItem(response.data);
        setSelectedFiles([]);
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
    if (status === 404) {
      setListItem([]);
    }
    setLoading(false);
  };

  const getDocumentTemplate = async () => {
    setLoading(true);
    let getFileTypesURL = "/api/document/template";
    await axiosPrivate
      .get(getFileTypesURL, {
        signal: controller.signal,
      })
      .then((response) => {
        response.data.fileType.value = null;
        response.data.fileType.fileTypes.forEach(function (item) {
          item.label = item.name;
        });
        response.data.customers.forEach(function (item) {
          item.label = item.name;
        });
        response.data.keywords.forEach(function (item) {
          item.customerId = null;
        });
        setFileTypeSearch(response.data.fileType);
        setKeyWordSearch(response.data.keywords);
        setTemplate(response.data.keywords);
        setCustomerList(response.data.customers);
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

  const viewOrDownloadFile = async (item, type) => {
    // type = download / view
    setLoading(true);
    const isCase = !item.entityType || item.entityType === "Case";
    const getFileUrl = isCase ? `/api/FileUpload/Download` : `/api/FileUpload/DownloadEntity`;
    const payload = isCase
      ? { fileName: item.keywordName, caseId: item.caseId }
      : { fileName: item.keywordName, entityType: item.entityType, entityId: item.entityId };
    await axiosPrivate
      .post(getFileUrl, payload)
      .then(async (response) => {
        const byteArray = Uint8Array.from(
          atob(response.data)
            .split("")
            .map((char) => char.charCodeAt(0))
        );
        const blob = new Blob([byteArray], {
          type: response.headers["content-type"],
        });
        const blobUrl = window.URL.createObjectURL(blob);
        if (type === "download") {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = item.keywordName;
          link.click();
        } else {
          setShowDialogPreview(true);
          setUrlPreviewImg({ blobUrl: blobUrl, fileName: item.keywordName });
        }
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

  const handleClickDelete = async (e) => {
    setLoading(true);
    e.preventDefault();
    const isCase = !deleteItem.entityType || deleteItem.entityType === "Case";
    const deleteURL = isCase ? "/api/FileUpload/Delete" : "/api/FileUpload/DeleteEntity";
    await axiosPrivate
      .put(deleteURL, deleteItem)
      .then(async (res) => {
        setShowAlert(false);
        await getFiles(e);
        setShowList(true);
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

  const handleToggleSelect = (keywordId) => {
    setSelectedFiles((prev) =>
      prev.includes(keywordId) ? prev.filter((id) => id !== keywordId) : [...prev, keywordId]
    );
  };

  const handleToggleSelectAll = () => {
    const items = listItem && listItem.items ? listItem.items : [];
    if (items.length === 0) return;
    const allIds = items.map((f) => f.keywordId);
    const allSelected = allIds.every((id) => selectedFiles.includes(id));
    setSelectedFiles(allSelected ? [] : allIds);
  };

  const handleBulkDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    const items = listItem && listItem.items ? listItem.items : [];
    const targets = items.filter((f) => selectedFiles.includes(f.keywordId));
    const caseTargets = targets.filter((f) => !f.entityType || f.entityType === "Case");
    const entityTargets = targets.filter((f) => f.entityType && f.entityType !== "Case");
    try {
      if (caseTargets.length > 0) {
        const payload = caseTargets.map((f) => ({ keywordId: f.keywordId, caseId: f.caseId, fileName: f.keywordName }));
        await axiosPrivate.put("/api/FileUpload/BulkDelete", payload);
      }
      for (const f of entityTargets) {
        await axiosPrivate.put("/api/FileUpload/DeleteEntity", {
          keywordId: f.keywordId,
          entityType: f.entityType,
          entityId: f.entityId,
          fileName: f.keywordName,
        });
      }
      setShowBulkDeleteAlert(false);
      await getFiles(e);
      setSnackbar({ isOpen: true, status: "success", message: "選択した書類を削除しました。" });
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleClickViewDetail = (item) => {
    setLoading(true);
    setViewTarget({
      entityType: item.entityType || "Case",
      entityId: item.entityType && item.entityType !== "Case" ? item.entityId : item.caseId,
    });
    setShowDialogCase(true);
    setLoading(false);
  };

  const handleClickSearch = async (e) => {
    await getFiles(e);
    setShowList(true);
  };

  const handleClickClear = () => {
    setKeyWordSearch((prevKeyWordSearch) =>
      prevKeyWordSearch.map((item) => ({
        ...item,
        value: "",
        fromValue: "",
        toValue: "",
        customerId: "",
      }))
    );
    setFileTypeSearch({ ...fileTypeSearch, value: null, label: "" });
  };

  const handleChangePageSize = async (e) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      pageSize: parseInt(e.target.value),
    });
    await getFiles(e);
  };
  const handleChangePage = async (e, value) => {
    commonActions.setPaginationState({
      ...commonState.paginationState,
      currentPage: value,
    });
    await getFiles(e);
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
    const items = listItem && listItem.items ? listItem.items : [];
    const allSelected = items.length > 0 && items.every((f) => selectedFiles.includes(f.keywordId));
    const someSelected = selectedFiles.length > 0 && !allSelected;
    return (
      <>
        <Pagination
          totalCount={totalCount}
          pageSize={commonState.paginationState.pageSize}
          currentPage={commonState.paginationState.currentPage}
          handleChangePageSize={handleChangePageSize}
          handleChangePage={handleChangePage}
        />
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Icons.Delete />}
              onClick={() => setShowBulkDeleteAlert(true)}
            >
              選択した書類を削除 ({selectedFiles.length}件)
            </Button>
          </div>
        )}
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 48 }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleToggleSelectAll}
                    disabled={items.length === 0}
                  />
                </TableCell>
                <TableCell>書類名</TableCell>
                <TableCell>種別</TableCell>
                <TableCell style={{ minWidth: "400px", textAlign: "right" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length > 0 ? (
                items.map((item, index) => {
                  return (
                    <TableRow key={item.keywordId}>
                      <TableCell style={{ width: 48 }}>
                        <Checkbox
                          checked={selectedFiles.includes(item.keywordId)}
                          onChange={() => handleToggleSelect(item.keywordId)}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          maxWidth: "900px",
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        <Truncate str={item.keywordName} maxLength={20} />
                      </TableCell>
                      <TableCell>{entityTypeLabel[item.entityType] || item.entityType || "案件"}</TableCell>
                      <TableCell
                        style={{
                          minWidth: "400px",
                          textAlign: "right",
                        }}
                      >
                        <div>
                          {item.isImage && (
                            <Button
                              variant="contained"
                              color="success"
                              to=""
                              startIcon={<Icons.Image />}
                              style={{ marginRight: "5px" }}
                              onClick={() => {
                                viewOrDownloadFile(item, "view");
                              }}
                              disabled={!item.isImage}
                            >
                              表示
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            color="success"
                            to=""
                            startIcon={<Icons.Download />}
                            style={{ marginRight: "5px" }}
                            onClick={async () => {
                              await viewOrDownloadFile(item, "download");
                            }}
                          >
                            ダウンロード
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<Icons.Delete />}
                            to=""
                            onClick={() => {
                              setShowAlert(true);
                              let itemDelete = {
                                keywordId: item.keywordId,
                                caseId: item.caseId,
                                entityType: item.entityType,
                                entityId: item.entityId,
                                fileName: item.keywordName,
                              };
                              setDeleteItem(itemDelete);
                            }}
                          >
                            削除
                          </Button>
                          <br />{" "}
                          <Button
                            variant="contained"
                            startIcon={<Icons.Assignment />}
                            style={{ marginTop: "5px" }}
                            onClick={() => {
                              handleClickViewDetail(item);
                            }}
                          >
                            詳細表示
                          </Button>{" "}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <span style={{ color: "#000" }}>
                      表示する項目がありません。
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  const dynamicGenerate = (item, templateItem) => {
    let typeValue = templateItem.typeValue;
    if (templateItem.fromTo && templateItem.typeValue === "decimal") {
      typeValue = "decimalrange";
    } else if (templateItem.fromTo && templateItem.typeValue === "datetime") {
      typeValue = "daterange";
    } else if (templateItem.keywordName === "取引先名") {
      typeValue = "list";
    }
    return (
      <GenericItems
        value={item.value}
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
        // using for decimal range
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
        handleInput3={(e, customer) => {
          const newState = keyWordSearch.map((value) => {
            if (value.keywordId === item.keywordId) {
              return {
                ...value,
                value: customer ? customer.label : "",
                customerId: customer ? customer.id : null,
              };
            } else return { ...value };
          });
          setKeyWordSearch(newState);
        }}
        options={customerList}
      />
    );
  };

  const generateTemplate = () => {
    if (template && template.length > 0) {
      template.sort((a, b) =>
        a.order > b.order ? 1 : b.order > a.order ? -1 : 0
      );
    }
    const mid = Math.ceil((template.length + 1) / 2);
    return (
      <>
        <Grid item xs={6}>
          <GenericItems
            value={fileTypeSearch.label}
            label={"書類種類"}
            type={"list"}
            options={fileTypeSearch.fileTypes}
            handleInput3={(e, item) => {
              setFileTypeSearch({
                ...fileTypeSearch,
                value: item ? (item.id ? item.id : null) : null,
                label: item ? (item.label ? item.label : "") : "",
              });
            }}
          />

          {template.map((templateItem, index) => {
            if (index + 1 < mid) {
              return keyWordSearch.map((item) => {
                if (item.keywordId === templateItem.keywordId) {
                  return dynamicGenerate(item, templateItem);
                }
              });
            }
          })}
        </Grid>
        <Grid item xs={6}>
          {/* Add the second half of the input fields here */}
          {template.map((templateItem, index) => {
            if (index + 1 >= mid) {
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
        {generateTemplate()}

        <Grid item xs={12}>
          <div className="handle-button">
            {/* Search and Clear Button */}
            <FormButton itemName="検索" onClick={handleClickSearch} />
            <FormButton
              itemName="検索条件の初期化"
              onClick={handleClickClear}
            />
          </div>
        </Grid>

        {showList ? (
          <Grid item xs={12}>
            <Results />
          </Grid>
        ) : null}
      </Grid>
      <ContentDialog
        open={showDialogPreview}
        closeDialog={() => setShowDialogPreview(false)}
      >
        <Grid container columnSpacing={5} rowSpacing={5}>
          {urlPreviewImg.blobUrl && (
            <Grid
              item
              xs={12}
              className="preview-file"
              style={{ marginTop: "10px" }}
            >
              <a href={urlPreviewImg.blobUrl} download={urlPreviewImg.fileName}>
                <IconButton size="small" aria-label="download">
                  <Icons.CloudDownload sx={{ color: "green", fontSize: 24 }} />
                </IconButton>
                書類のダウンロード
              </a>
              <img
                src={urlPreviewImg.blobUrl}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  border: "3px solid #11596F",
                }}
              />
            </Grid>
          )}
        </Grid>
      </ContentDialog>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <ConfirmDialog
        open={showAlert}
        closeDialog={() => setShowAlert(false)}
        item={deleteItem.name}
        typeDialog="書類削除の確認"
        mainContent="書類を削除すると、案件から関連書類として参照できなくなります。本当に削除しますか"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
        handleFunction={handleClickDelete}
      ></ConfirmDialog>
      <ConfirmDialog
        open={showBulkDeleteAlert}
        closeDialog={() => setShowBulkDeleteAlert(false)}
        item={`${selectedFiles.length}件の書類`}
        handleFunction={handleBulkDelete}
        typeDialog="書類一括削除の確認"
        mainContent="選択した書類を削除すると、案件から関連書類として参照できなくなります。本当に削除しますか"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <ContentDialog
        open={showDialogCase}
        closeDialog={() => setShowDialogCase(false)}
      >
        {viewTarget.entityType === "PurchaseOrder" && (
          <PurchaseOrderDetail purchaseOrderId={viewTarget.entityId} />
        )}
        {viewTarget.entityType === "GoodsReceipt" && (
          <GoodsReceiptDetail goodsReceiptId={viewTarget.entityId} />
        )}
        {viewTarget.entityType === "PurchaseInvoice" && (
          <PurchaseInvoiceDetail purchaseInvoiceId={viewTarget.entityId} />
        )}
        {(!viewTarget.entityType || viewTarget.entityType === "Case") && (
          <CaseDetail caseId={viewTarget.entityId} createType={false} />
        )}
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default DocumentSearch;
