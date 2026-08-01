import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import goodsReceiptService from "../services/goodsReceiptService";
import purchaseOrderService from "../services/purchaseOrderService";
import * as Icons from "@mui/icons-material";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from "@mui/material";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const CONFIDENCE_THRESHOLD = 0.7;
const RECEIVABLE_STATUSES = ["Confirmed", "PartiallyReceived"];

const GoodsReceiptIntakeUpload = () => {
  const [stage, setStage] = useState("upload"); // "upload" | "review"
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const axiosPrivate = useAxiosPrivate();
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  useEffect(async () => {
    try {
      const response = await purchaseOrderService.getAll(axiosPrivate, null, null, null, null, 1000, 1);
      const eligible = (response.data.items || []).filter((po) =>
        RECEIVABLE_STATUSES.includes(po.status)
      );
      setPurchaseOrders(eligible.map((po) => ({ ...po, label: po.purchaseOrderNumber })));
    } catch (error) {
      setPurchaseOrders([]);
    }
  }, []);

  const handleSelectPurchaseOrder = async (po) => {
    setSelectedPurchaseOrderId(po ? po.id : null);
    if (!po) {
      setSelectedPurchaseOrder(null);
      return;
    }
    try {
      const response = await purchaseOrderService.getById(axiosPrivate, po.id);
      setSelectedPurchaseOrder(response.data);
    } catch (error) {
      setSelectedPurchaseOrder(null);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("ファイルサイズが大きすぎます（上限15MB）。別のファイルを選択してください。");
      setFile(null);
      return;
    }
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setFileError("JPEG・PNG・PDFファイルのみアップロードできます。");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleExtract = async () => {
    if (!selectedPurchaseOrderId) {
      setFileError("対象の発注を選択してください。");
      return;
    }
    if (!file) {
      setFileError("ファイルを選択してください。");
      return;
    }
    setLoading(true);
    try {
      const response = await goodsReceiptService.extract(axiosPrivate, file, selectedPurchaseOrderId);
      const draft = response.data;

      setReceivedDate(
        draft.receivedDateGuess ? draft.receivedDateGuess.slice(0, 10) : new Date().toISOString().slice(0, 10)
      );
      setItems(
        (draft.items || []).map((i) => ({
          key: Math.random().toString(36).slice(2),
          purchaseOrderItemId: i.purchaseOrderItemIdMatch || null,
          productId: i.productIdMatch || null,
          productNameRaw: i.productNameRaw,
          receivedQuantity: i.receivedQuantity,
          confidence: i.confidence,
        }))
      );
      setStage("review");
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "AIによる読み取りが完了しました。内容をご確認のうえ、登録してください。",
      });
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message:
          error.response?.data ||
          "画像からの読み取りに失敗しました。もう一度お試しいただくか、手動で入力してください。",
      });
    }
    setLoading(false);
  };

  const handleRemoveRow = (key) => {
    setItems((value) => value.filter((i) => i.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    setItems((value2) =>
      value2.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  };

  const handlePurchaseOrderItemSelected = (key, poItem) => {
    setItems((value) =>
      value.map((i) =>
        i.key === key
          ? {
              ...i,
              purchaseOrderItemId: poItem ? poItem.id : null,
              productId: poItem ? poItem.productId : i.productId,
              productNameRaw: poItem ? poItem.productNameRaw : i.productNameRaw,
              confidence: 1,
            }
          : i
      )
    );
  };

  const validateForm = () => {
    let newErrors = {};
    if (!receivedDate) {
      newErrors.receivedDate = "入荷日は必須項目です。";
    }
    if (
      items.length === 0 ||
      items.some((i) => !i.purchaseOrderItemId || !i.receivedQuantity)
    ) {
      newErrors.items = "対象の発注明細と数量をすべて指定してください。";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Attaches the original 納品書 image that was uploaded for AI extraction to the newly created
  // goods receipt, so the source document isn't discarded once the data has been extracted from it.
  // Best-effort: the goods receipt itself is already saved by this point, so a failure here is
  // swallowed rather than surfaced as an error to avoid implying the whole registration failed.
  const attachSourceFile = async (goodsReceiptId) => {
    if (!file || !goodsReceiptId) {
      return;
    }
    try {
      const typeResponse = await axiosPrivate.get("/api/Type/file-type");
      const fileTypes = typeResponse.data || [];
      const fileType =
        fileTypes.find((t) => t.name === "納品書") ||
        fileTypes.find((t) => t.name === "その他") ||
        fileTypes[0];
      if (!fileType) {
        return;
      }
      const formData = new FormData();
      formData.append("FileToUpload", file);
      formData.append("EntityType", "GoodsReceipt");
      formData.append("EntityId", goodsReceiptId);
      formData.append("FileTypeId", fileType.id);
      formData.append("FileName", file.name);
      await axiosPrivate.post("/api/FileUpload/UploadEntity", formData);
    } catch (error) {
      // Non-fatal: the goods receipt itself was already registered successfully.
    }
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "問題が発生しました。入力内容を修正してください。",
      });
      return;
    }

    setLoading(true);
    const payload = {
      purchaseOrderId: selectedPurchaseOrderId,
      receivedDate,
      sourceType: "DocumentUpload",
      goodsReceiptItems: items.map((i) => ({
        purchaseOrderItemId: i.purchaseOrderItemId,
        productId: i.productId,
        productNameRaw: i.productNameRaw,
        receivedQuantity: Number(i.receivedQuantity),
      })),
    };

    try {
      const response = await goodsReceiptService.create(axiosPrivate, payload);
      await attachSourceFile(response.data.goodsReceiptId);
      const warnings = response.data.overDeliveryWarnings || [];
      setSnackbar({
        isOpen: true,
        status: warnings.length > 0 ? "warning" : "success",
        message:
          warnings.length > 0
            ? `入荷登録は完了しましたが、注意事項があります：${warnings.join(" ")}`
            : "入荷の登録は正常に完了しました！",
      });
      handleReset();
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setStage("upload");
    setFile(null);
    setFileError("");
    setSelectedPurchaseOrderId(null);
    setSelectedPurchaseOrder(null);
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setItems([]);
  };

  const poItemOptions = (selectedPurchaseOrder?.purchaseOrderItems || []).map((i) => ({
    ...i,
    label: i.productNameRaw,
  }));

  if (stage === "upload") {
    return (
      <section className="goods-receipt-intake-upload">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <p>
              対象の発注を選び、納品書の写真またはスキャン画像（JPEG・PNG・PDF、最大15MB）をアップロードすると、
              AIが内容を読み取り、入荷登録フォームに自動入力します。内容は登録前に必ずご確認ください。
            </p>
          </Grid>
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">
                対象の発注<span className="required-icon"> *</span>
              </label>
              <FormSelection
                value={purchaseOrders.find((p) => p.id === selectedPurchaseOrderId) || null}
                options={purchaseOrders}
                optionSelected={(e, value) => handleSelectPurchaseOrder(value)}
              />
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className="section-item">
              <label className="section-label">ファイル選択</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
              {fileError && <div style={{ color: "red", marginTop: 5 }}>{fileError}</div>}
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className="handle-button">
              <FormButton itemName="AIで読み取る" onClick={handleExtract} />
            </div>
          </Grid>
        </Grid>
        <LoadingSpinner loading={loading}></LoadingSpinner>
        <FormSnackbar item={snackbar} setItem={setSnackbar} />
      </section>
    );
  }

  return (
    <section className="goods-receipt-intake-review">
      <Grid container columnSpacing={5} rowSpacing={3}>
        <Grid item xs={12}>
          <Chip
            icon={<Icons.AutoAwesome />}
            label="AIが読み取った内容です。登録前に必ずご確認ください。"
            color="info"
          />
        </Grid>
        <Grid item xs={12}>
          <b>対象の発注：</b> {selectedPurchaseOrder?.purchaseOrderNumber}
        </Grid>
        <Grid item xs={3}>
          <div className="section-item">
            <label className="section-label">
              入荷日<span className="required-icon"> *</span>
            </label>
            <input
              type="date"
              className="section-input"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
            <errors>{errors.receivedDate}</errors>
          </div>
        </Grid>

        <Grid item xs={12}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>対象の発注明細</TableCell>
                <TableCell style={{ width: "15%" }}>入荷数量</TableCell>
                <TableCell style={{ width: "10%" }}>AI信頼度</TableCell>
                <TableCell style={{ width: "5%" }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const lowConfidence = item.confidence < CONFIDENCE_THRESHOLD;
                return (
                  <TableRow
                    key={item.key}
                    style={lowConfidence ? { backgroundColor: "#fff3cd" } : undefined}
                  >
                    <TableCell>
                      <FormSelection
                        value={
                          poItemOptions.find((p) => p.id === item.purchaseOrderItemId) ||
                          item.productNameRaw ||
                          null
                        }
                        options={poItemOptions}
                        optionSelected={(e, value) =>
                          handlePurchaseOrderItemSelected(item.key, value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="section-input"
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          handleItemChange(item.key, "receivedQuantity", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {lowConfidence ? (
                        <Chip label="要確認" color="warning" size="small" />
                      ) : (
                        <Chip label="OK" color="success" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleRemoveRow(item.key)} size="small">
                        <Icons.Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <errors>{errors.items}</errors>
        </Grid>

        <Grid item xs={12}>
          <div className="handle-button">
            <FormButton itemName="この内容で登録" onClick={handleConfirm} />
            <FormButton itemName="やり直す" onClick={handleReset} buttonType="cancel" />
          </div>
        </Grid>
      </Grid>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default GoodsReceiptIntakeUpload;
