import { Grid, IconButton, Button, Checkbox } from "@mui/material";
import { useEffect, useState } from "react";
import GenericItems from "./until/GenericItems";
import DialogHandle from "./until/DialogHandle";
import FormButton from "./until/FormButton";
// import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import FormSnackbar from "./until/FormSnackbar";
import LoadingSpinner from "./until/LoadingSpinner";
import CircularProgress from "@mui/material/CircularProgress";
import Truncate from "./until/Truncate";
import ConfirmDialog from "./until/ConfirmBox";
import * as Icons from "@mui/icons-material";
import ContentDialog from "./until/ContentDialog.js";

window.Buffer = window.Buffer || require("buffer").Buffer;

const CaseDetail = ({ caseId, createType = true }) => {
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  // const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const controller = new AbortController();

  const [template, setTemplate] = useState([]);
  const [data, setData] = useState([]);
  const [listItemFile, setListItemFile] = useState([]);
  const [urlPreviewImg, setUrlPreviewImg] = useState({
    blobUrl: "",
    fileName: "",
  });
  const [fileDelete, setFileDelete] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [showDialogPreivew, setShowDialogPreivew] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });
  const [caseIdName, setCaseIdName] = useState({
    id: caseId,
    name: "",
  });
  const [optionFileType, setOptionFileType] = useState([]);
  const [disableAttach, setDisableAttach] = useState(false);
  const [errors, setErrors] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = useState(false);

  useEffect(async () => {
    setShowDialogPreivew(false);
    setShowDialog(false);
    setLoading(true);
    await getCaseTemplate();
    setLoading(false);
    if (caseId) {
      setDisableAttach(false);
      await getCaseByCaseId();
      await getFilesOfCase();
    } else {
      setDisableAttach(true);
    }
  }, []);

  const validateForm = () => {
    let errors = [];

    template.map((item) => {
      if (item.isRequired) {
        let currentValue;
        data.map((value) => {
          if (value.keywordId === item.keywordId) {
            return (currentValue = value.value);
          }
        });
        if (!currentValue) {
          errors.push({
            keywordId: item.keywordId,
            value: item.keywordName + "は必須項目です。",
          });
        }
      }
    });

    // Set the errors and update form validity
    setErrors(errors);
    return errors.length === 0;
  };

  const getCaseTemplate = async (e) => {
    setLoading(true);
    let templateURL = "/api/Template/template";
    // call API get template
    await axiosPrivate
      .get(templateURL, {
        signal: controller.signal,
      })
      .then((response) => {
        response.data.keywords.forEach((element) => {
          element.value = "";
        });
        response.data.customers.forEach(function (item) {
          item.label = item.name;
        });
        setCustomerList(response.data.customers);
        setTemplate(response.data.keywords);
        setData(response.data.keywords);
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

  const getCaseByCaseId = async () => {
    setLoading(true);
    let templateURL = `/api/Case?caseId=${caseId}`;
    await axiosPrivate
      .get(templateURL, {
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        },
      })
      .then((response) => {
        setData(response.data.caseKeywordValues);
        setCaseIdName({
          id: response.data.caseId,
          name: response.data.caseName,
        });
      })
      .catch(() => {
        setData([]);
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });

    setLoading(false);
  };

  const getFilesOfCase = async () => {
    setLoadingFile(true);
    setSelectedFiles([]);
    let getFilesUploadURL = `/api/Case/file/getall?caseId=${caseIdName.id}`;
    var { status } = await axiosPrivate
      .get(getFilesUploadURL, {
        signal: controller.signal,
        validateStatus: () => true,
      })
      .then((response) => {
        setListItemFile(response.data);
        return response;
      })
      .catch(() => {
        setListItemFile([]);
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
    if (status === 404) {
      setListItemFile([]);
    }

    setLoadingFile(false);
  };

  const handleToggleSelect = (keywordId) => {
    setSelectedFiles((prev) =>
      prev.includes(keywordId) ? prev.filter((id) => id !== keywordId) : [...prev, keywordId]
    );
  };

  const handleToggleSelectAll = () => {
    if (!listItemFile || listItemFile.length === 0) return;
    const allIds = listItemFile.map((f) => f.keywordId);
    const allSelected = allIds.every((id) => selectedFiles.includes(id));
    setSelectedFiles(allSelected ? [] : allIds);
  };

  const handleBulkDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = listItemFile
      .filter((f) => selectedFiles.includes(f.keywordId))
      .map((f) => ({ keywordId: f.keywordId, caseId: caseIdName.id, fileName: f.fileName }));
    await axiosPrivate
      .put("/api/FileUpload/BulkDelete", payload)
      .then(async () => {
        await getFilesOfCase();
        setShowBulkDeleteAlert(false);
        setSnackbar({ isOpen: true, status: "success", message: "選択した書類を削除しました。" });
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

  const viewOrDownloadFile = async (item, type) => {
    setLoading(true);
    let getFileUrl = `/api/FileUpload/Download`;
    let payload = {
      fileName: item.fileName,
      caseId: caseIdName.id,
    };
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
          link.download = item.fileName;
          link.click();
        } else {
          setShowDialogPreivew(true);
          setUrlPreviewImg({ blobUrl: blobUrl, fileName: item.fileName });
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

  const handleClickDeleteFile = async (e) => {
    setLoading(true);
    e.preventDefault();
    let deleteFileUrl = `/api/FileUpload/Delete`;
    let payload = fileDelete;
    payload.caseId = caseIdName.id;
    await axiosPrivate
      .put(deleteFileUrl, payload)
      .then(async (response) => {
        setUrlPreviewImg({ ...urlPreviewImg, blobUrl: "", fileName: "" });
        await getFilesOfCase();
        setShowAlert(false);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "書類は正常に削除されました。",
        });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    validateForm();
    if (!validateForm()) {
      // Form is valid, perform the submission logic
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "問題が発生しました。入力内容を修正してください。",
      });
      setLoading(false);
      return;
    } else {
    }

    let caseCreateURL = "/api/Case";
    if (caseIdName.id) {
      let payload = {
        caseId: caseIdName.id,
        keywordValues: data,
      };
      await axiosPrivate
        .put(caseCreateURL, payload, {
          signal: controller.signal,
        })
        .then((response) => {
          setSnackbar({
            isOpen: true,
            status: "success",
            message: "案件情報の更新は正常に完了しました!",
          });
          setDisableAttach(false);
          return response;
        })
        .catch((error) => {
          setSnackbar({
            isOpen: true,
            status: "error",
            message:
              "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
          });
        });
    } else {
      let payload = {
        keywordValues: data,
      };
      await axiosPrivate
        .post(caseCreateURL, payload, {
          signal: controller.signal,
        })
        .then((response) => {
          setCaseIdName({
            name: response.data.name,
            id: response.data.id,
          });
          setSnackbar({
            isOpen: true,
            status: "success",
            message: "案件の作成は正常に完了しました!",
          });
          setDisableAttach(false);
          return response;
        })
        .catch(() => {
          setSnackbar({
            isOpen: true,
            status: "error",
            message:
              "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
          });
        });
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setCaseIdName({ name: "", id: null });
    const newState = data.map((value) => {
      return { ...value, value: "" };
    });
    setListItemFile([]);
    setData(newState);
  };

  const getFileTypes = async () => {
    let getFileTypesURL = "/api/Type/file-type";
    await axiosPrivate
      .get(getFileTypesURL, {
        signal: controller.signal,
      })
      .then((response) => {
        let options = [];
        response.data.forEach(function (item) {
          options.push({
            id: item.id,
            label: item.name,
          });
        });
        setOptionFileType(options);
        return response;
      })
      .catch(() => {
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });
  };

  const handleAttach = async () => {
    await getFileTypes();
    setShowDialog(true);
  };

  const closeDialogAttach = async () => {
    setShowDialog(false);
    await getFilesOfCase();
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
    if (templateItem.keywordName === "取引先名") {
      typeValue = "customerlist";
    }
    return (
      <GenericItems
        value={handleGenerateCustomerName(item, templateItem)}
        label={templateItem.keywordName}
        type={typeValue}
        key={templateItem.order}
        handleInput={(e) => {
          const newState = data.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, value: e.target.value };
            } else return { ...value };
          });
          setData(newState);
        }}
        handleInput3={(e) => {
          const newState = data.map((value) => {
            if (value.keywordId === item.keywordId) {
              return { ...value, value: e.target.outerText };
            } else return { ...value };
          });
          setData(newState);
        }}
        handleInputCustomer={(e, customer) => {
          const newState = data.map((value) => {
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
          setData(newState);
        }}
        optionCustomers={customerList}
        options={item.metadata}
        required={templateItem.isRequired}
        maxLength={templateItem.maxLength}
      >
        {errors.map((error) => {
          if (error.keywordId === item.keywordId) {
            return <errors>{error.value}</errors>;
          }
        })}
      </GenericItems>
    );
  };
  const generateCode = () => {
    template.sort((a, b) =>
      a.order > b.order ? 1 : b.order > a.order ? -1 : 0
    );
    const mid = template.length / 2;
    return (
      <>
        <Grid item xs={12}>
          <strong>
            <h2 style={{ margin: "1px" }}>案件番号：{caseIdName.name}</h2>
          </strong>
        </Grid>
        <Grid item xs={6}>
          {template.map((templateItem, index) => {
            if (index + 1 <= mid && templateItem.typeValue !== "textarea") {
              return data.map((item) => {
                if (item.keywordId === templateItem.keywordId) {
                  return dynamicGenerate(item, templateItem);
                }
              });
            }
          })}
        </Grid>
        <Grid item xs={6}>
          {template.map((templateItem, index) => {
            if (index + 1 > mid && templateItem.typeValue !== "textarea") {
              return data.map((item) => {
                if (item.keywordId === templateItem.keywordId) {
                  return dynamicGenerate(item, templateItem);
                }
              });
            }
          })}
        </Grid>
        <Grid item xs={12}>
          {template.map((templateItem, index) => {
            return data.map((item) => {
              if (
                item.keywordId === templateItem.keywordId &&
                templateItem.typeValue === "textarea"
              ) {
                return dynamicGenerate(item, templateItem);
              }
            });
          })}
        </Grid>
      </>
    );
  };

  return (
    <section className="customer">
      <form onSubmit={handleSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          {generateCode()}
          <Grid item xs={12}>
            {/* <span>Attached {atchedFile} files</span> */}
            <div className="handle-button">
              <FormButton
                itemName="関連書類"
                buttonType="attach"
                titleContent={
                  disableAttach
                    ? "関連書類が存在しません。案件を保存してから書類の添付や管理が行えます。"
                    : ""
                }
                onClick={handleAttach}
                disabled={disableAttach}
              />
              {/* Save Button */}
              <FormButton itemName="保存" type="submit" />
              {createType ? (
                <FormButton itemName="新規作成" onClick={handleClear} />
              ) : undefined}
            </div>
          </Grid>
        </Grid>
      </form>
      <>
        <Grid item xs={12}>
          {listItemFile && listItemFile[0] != null && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 4, gap: 8 }}>
              <Checkbox
                checked={listItemFile.length > 0 && listItemFile.every((f) => selectedFiles.includes(f.keywordId))}
                indeterminate={selectedFiles.length > 0 && !listItemFile.every((f) => selectedFiles.includes(f.keywordId))}
                onChange={handleToggleSelectAll}
              />
              <span>全選択</span>
              {selectedFiles.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Icons.Delete />}
                  onClick={() => setShowBulkDeleteAlert(true)}
                >
                  選択した書類を削除 ({selectedFiles.length}件)
                </Button>
              )}
            </div>
          )}
          <ul id="results" className="search-results" style={{ marginTop: 10 }}>
            {listItemFile && listItemFile[0] != null ? (
              listItemFile.map((item, index) => {
                return (
                  <li className="search-result" key={item.keywordId}>
                    <Checkbox
                      checked={selectedFiles.includes(item.keywordId)}
                      onChange={() => handleToggleSelect(item.keywordId)}
                      style={{ padding: "0 4px 0 0" }}
                    />
                    <Truncate
                      str={item.fileName}
                      maxLength={20}
                      style={{ padding: "10px" }}
                    />
                    <div
                      className="search-action"
                      style={{
                        minWidth: 350,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {item.isImage && (
                        <Button
                          color="primary"
                          variant="outlined"
                          onClick={async () => {
                            await viewOrDownloadFile(item, "view");
                          }}
                          startIcon={<Icons.Image />}
                        >
                          表示
                        </Button>
                      )}
                      <Button
                        startIcon={<Icons.Download />}
                        color="primary"
                        variant="outlined"
                        onClick={async () => {
                          await viewOrDownloadFile(item, "download");
                        }}
                      >
                        ダウンロード
                      </Button>
                      <Button
                        startIcon={<Icons.Delete />}
                        color="error"
                        variant="outlined"
                        onClick={() => {
                          setFileDelete(item);
                          setShowAlert(true);
                        }}
                      >
                        削除
                      </Button>
                    </div>
                  </li>
                );
              })
            ) : (
              <li style={{ textAlign: "center" }}>
                {loadingFile ? (
                  <CircularProgress />
                ) : (
                  <p>表示する項目がありません。</p>
                )}
              </li>
            )}
          </ul>
        </Grid>
        {urlPreviewImg.blobUrl && (
          <ContentDialog open={showDialogPreivew} closeDialog={() => setShowDialogPreivew(false)}>
            <Grid item xs={12} className="preview-file">
              <a href={urlPreviewImg.blobUrl} download={urlPreviewImg.fileName}>
                <IconButton size="small" aria-label="download">
                  <Icons.CloudDownload sx={{ color: "green", fontSize: 40 }} />
                </IconButton>
                書類のダウンロード
              </a>
              <img
                src={urlPreviewImg.blobUrl}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  border: "3px solid #1F3A5F",
                }}
              />
            </Grid>
          </ContentDialog>
        )}
        </>
        <ConfirmDialog
          open={showAlert}
          closeDialog={() => setShowAlert(false)}
          item={fileDelete.fileName}
          handleFunction={handleClickDeleteFile}
          typeDialog="書類削除の確認"
          mainContent="書類を削除すると、案件から関連書類として参照できなくなります。本当に削除しますか"
          cancelBtnDialog="いいえ"
          confirmBtnDialog="はい"
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

      <DialogHandle
        open={showDialog}
        closeDialog={async () => await closeDialogAttach()}
        title="関連書類の添付"
        optionFileType={optionFileType}
        caseId={caseId || caseIdName.id}
      />
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default CaseDetail;
