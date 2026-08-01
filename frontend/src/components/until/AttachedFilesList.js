import { useState, useEffect } from "react";
import { Button, Grid, IconButton } from "@mui/material";
import * as Icons from "@mui/icons-material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import Truncate from "./Truncate";
import ConfirmDialog from "./ConfirmBox";
import ContentDialog from "./ContentDialog.js";
import FormSnackbar from "./FormSnackbar.js";
import LoadingSpinner from "./LoadingSpinner";

// Inline "here's what's already attached" list for entity-agnostic file attachments
// (PurchaseOrder/GoodsReceipt), mirroring what CaseDetail.js shows on its own page —
// separate from DialogHandle.js, which stays focused on the add/manage-many modal.
// Bump `refreshToken` from the parent whenever the attach dialog closes to re-fetch.
const AttachedFilesList = ({ entityType, entityId, refreshToken }) => {
  const axiosPrivate = useAxiosPrivate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileDelete, setFileDelete] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [urlPreviewImg, setUrlPreviewImg] = useState({ blobUrl: "", fileName: "" });
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "",
  });

  useEffect(async () => {
    if (!entityId) {
      setItems([]);
      return;
    }
    await getFiles();
  }, [entityType, entityId, refreshToken]);

  const getFiles = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get(
        `/api/FileUpload/Entity?entityType=${entityType}&entityId=${entityId}`
      );
      setItems(response.data || []);
    } catch (error) {
      setItems([]);
    }
    setLoading(false);
  };

  const viewOrDownloadFile = async (item, type) => {
    // type = "download" | "view"
    setLoading(true);
    try {
      const response = await axiosPrivate.post("/api/FileUpload/DownloadEntity", {
        fileName: item.fileName,
        entityType,
        entityId,
      });
      const byteArray = Uint8Array.from(
        atob(response.data)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      const blob = new Blob([byteArray], { type: response.headers["content-type"] });
      const blobUrl = window.URL.createObjectURL(blob);
      if (type === "download") {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = item.fileName;
        link.click();
      } else {
        setUrlPreviewImg({ blobUrl, fileName: item.fileName });
        setShowPreview(true);
      }
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axiosPrivate.put("/api/FileUpload/DeleteEntity", {
        entityType,
        entityId,
        keywordId: fileDelete.keywordId,
        fileName: fileDelete.fileName,
      });
      setShowAlert(false);
      await getFiles();
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  if (!entityId) {
    return null;
  }

  return (
    <div style={{ marginTop: 10 }}>
      <label className="section-label">添付ファイル</label>
      {items.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.9rem" }}>添付ファイルはありません。</p>
      ) : (
        <ul id="results" className="search-results" style={{ marginTop: 6 }}>
          {items.map((item) => (
            <li className="search-result" key={item.keywordId}>
              <Truncate str={item.fileName} maxLength={30} style={{ padding: "10px" }} />
              <div
                className="search-action"
                style={{ minWidth: 220, display: "flex", justifyContent: "flex-end" }}
              >
                {item.isImage && (
                  <Button
                    startIcon={<Icons.Image />}
                    className="search-edit"
                    onClick={() => viewOrDownloadFile(item, "view")}
                  >
                    表示
                  </Button>
                )}
                <Button
                  startIcon={<Icons.Download />}
                  className="search-edit"
                  onClick={() => viewOrDownloadFile(item, "download")}
                >
                  ダウンロード
                </Button>
                <Button
                  startIcon={<Icons.Delete />}
                  className="search-edit"
                  onClick={() => {
                    setFileDelete(item);
                    setShowAlert(true);
                  }}
                >
                  削除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {urlPreviewImg.blobUrl && (
        <ContentDialog open={showPreview} closeDialog={() => setShowPreview(false)}>
          <Grid item xs={12} className="preview-file">
            <a href={urlPreviewImg.blobUrl} download={urlPreviewImg.fileName}>
              <IconButton size="small" aria-label="download">
                <Icons.CloudDownload sx={{ color: "green", fontSize: 40 }} />
              </IconButton>
              書類のダウンロード
            </a>
            <img
              src={urlPreviewImg.blobUrl}
              alt={urlPreviewImg.fileName}
              style={{ width: "100%", marginTop: "10px", border: "3px solid #11596F" }}
            />
          </Grid>
        </ContentDialog>
      )}
      <ConfirmDialog
        open={showAlert}
        closeDialog={() => setShowAlert(false)}
        item={fileDelete.fileName}
        handleFunction={handleDelete}
        typeDialog="書類削除の確認"
        mainContent="書類を削除すると、参照できなくなります。本当に削除しますか"
        cancelBtnDialog="いいえ"
        confirmBtnDialog="はい"
      ></ConfirmDialog>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </div>
  );
};

export default AttachedFilesList;
