import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import purchaseOrderService from "../services/purchaseOrderService";
import supplierService from "../services/supplierService";
import productService from "../services/productService";
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

const emptyRow = () => ({
  key: Math.random().toString(36).slice(2),
  productId: null,
  productNameRaw: "",
  quantity: 1,
  unitPrice: 0,
  confidence: 1,
});

const PurchaseOrderIntakeUpload = () => {
  const [stage, setStage] = useState("upload"); // "upload" | "review"
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierMatched, setSupplierMatched] = useState(true);
  const [supplierNameGuess, setSupplierNameGuess] = useState("");
  const [supplierNameConfidence, setSupplierNameConfidence] = useState(1);
  const [latestData, setLatestData] = useState({
    supplierId: null,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: "",
    note: "",
  });
  const [items, setItems] = useState([emptyRow()]);
  const [errors, setErrors] = useState({});
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
    try {
      const productResponse = await productService.list(axiosPrivate);
      setProducts(productResponse.data || []);
    } catch (error) {
      setProducts([]);
    }
  }, []);

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
    if (!file) {
      setFileError("ファイルを選択してください。");
      return;
    }
    setLoading(true);
    try {
      const response = await purchaseOrderService.extract(axiosPrivate, file);
      const draft = response.data;

      setSupplierMatched(!!draft.supplierIdMatch);
      setSupplierNameGuess(draft.supplierNameGuess || "");
      setSupplierNameConfidence(
        draft.supplierNameConfidence != null ? draft.supplierNameConfidence : 1
      );
      setLatestData({
        supplierId: draft.supplierIdMatch || null,
        orderDate: draft.orderDateGuess
          ? draft.orderDateGuess.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: draft.expectedDeliveryDateGuess
          ? draft.expectedDeliveryDateGuess.slice(0, 10)
          : "",
        note: "",
      });
      setItems(
        (draft.items || []).map((i) => ({
          key: Math.random().toString(36).slice(2),
          productId: i.productIdMatch || null,
          productNameRaw: i.productNameRaw,
          quantity: i.quantity,
          unitPrice: i.unitPrice || 0,
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

  const handleAddRow = () => {
    setItems((value) => [...value, emptyRow()]);
  };

  const handleRemoveRow = (key) => {
    setItems((value) => value.filter((i) => i.key !== key));
  };

  const handleItemChange = (key, field, value) => {
    setItems((value2) =>
      value2.map((i) => (i.key === key ? { ...i, [field]: value } : i))
    );
  };

  const handleProductSelected = (key, product) => {
    setItems((value) =>
      value.map((i) =>
        i.key === key
          ? {
              ...i,
              productId: product ? product.id : null,
              productNameRaw: product ? product.name : i.productNameRaw,
              unitPrice: product && product.unitPrice != null ? product.unitPrice : i.unitPrice,
              confidence: 1,
            }
          : i
      )
    );
  };

  const validateForm = () => {
    let newErrors = {};
    if (!latestData.supplierId) {
      newErrors.supplierId = "仕入先を選択してください。";
    }
    if (!latestData.orderDate) {
      newErrors.orderDate = "発注日は必須項目です。";
    }
    if (items.length === 0 || items.some((i) => !i.productNameRaw || !i.quantity)) {
      newErrors.items = "商品名と数量を入力してください。";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      supplierId: latestData.supplierId,
      orderDate: latestData.orderDate,
      expectedDeliveryDate: latestData.expectedDeliveryDate || null,
      note: latestData.note,
      sourceType: "DocumentUpload",
      purchaseOrderItems: items.map((i) => ({
        productId: i.productId,
        productNameRaw: i.productNameRaw,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    };

    try {
      await purchaseOrderService.create(axiosPrivate, payload);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "発注の登録は正常に完了しました！",
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
    setLatestData({
      supplierId: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: "",
      note: "",
    });
    setItems([emptyRow()]);
    setSupplierMatched(true);
    setSupplierNameGuess("");
    setSupplierNameConfidence(1);
  };

  const total = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );

  if (stage === "upload") {
    return (
      <section className="purchase-order-intake-upload">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <p>
              見積書の写真またはスキャン画像（JPEG・PNG・PDF、最大15MB）をアップロードすると、
              AIが内容を読み取り、発注登録フォームに自動入力します。内容は登録前に必ずご確認ください。
            </p>
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
    <section className="purchase-order-intake-review">
      <Grid container columnSpacing={5} rowSpacing={3}>
        <Grid item xs={12}>
          <Chip
            icon={<Icons.AutoAwesome />}
            label="AIが読み取った内容です。登録前に必ずご確認ください。"
            color="info"
          />
        </Grid>
        <Grid item xs={6}>
          <div className="section-item">
            <label className="section-label">
              仕入先<span className="required-icon"> *</span>
            </label>
            <FormSelection
              value={suppliers.find((s) => s.id === latestData.supplierId) || null}
              options={suppliers}
              optionSelected={(e, value) => {
                setLatestData((v) => ({ ...v, supplierId: value ? value.id : null }));
                setSupplierMatched(true);
              }}
            />
            {supplierNameGuess && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  AIが読み取った仕入先名：{supplierNameGuess}
                </span>
                {supplierNameConfidence < CONFIDENCE_THRESHOLD ? (
                  <Chip label="要確認" color="warning" size="small" />
                ) : (
                  <Chip label="OK" color="success" size="small" variant="outlined" />
                )}
              </div>
            )}
            {!supplierMatched && (
              <div style={{ color: "#b26a00" }}>
                AIが仕入先を自動特定できませんでした。手動で選択してください。
              </div>
            )}
            <errors>{errors.supplierId}</errors>
          </div>
        </Grid>
        <Grid item xs={3}>
          <div className="section-item">
            <label className="section-label">
              発注日<span className="required-icon"> *</span>
            </label>
            <input
              type="date"
              className="section-input"
              value={latestData.orderDate}
              onChange={(e) => setLatestData((v) => ({ ...v, orderDate: e.target.value }))}
            />
            <errors>{errors.orderDate}</errors>
          </div>
        </Grid>
        <Grid item xs={3}>
          <div className="section-item">
            <label className="section-label">納品予定日</label>
            <input
              type="date"
              className="section-input"
              value={latestData.expectedDeliveryDate}
              onChange={(e) =>
                setLatestData((v) => ({ ...v, expectedDeliveryDate: e.target.value }))
              }
            />
          </div>
        </Grid>

        <Grid item xs={12}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>商品</TableCell>
                <TableCell style={{ width: "12%" }}>数量</TableCell>
                <TableCell style={{ width: "15%" }}>単価</TableCell>
                <TableCell style={{ width: "15%" }}>金額</TableCell>
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
                          products.find((p) => p.id === item.productId) ||
                          item.productNameRaw ||
                          null
                        }
                        options={products}
                        optionSelected={(e, value) => handleProductSelected(item.key, value)}
                      />
                      {!item.productId && (
                        <input
                          type="text"
                          className="section-input"
                          placeholder="商品名を入力"
                          value={item.productNameRaw}
                          onChange={(e) =>
                            handleItemChange(item.key, "productNameRaw", e.target.value)
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="section-input"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.key, "quantity", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        className="section-input"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.key, "unitPrice", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
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
          <div style={{ marginTop: 10 }}>
            <FormButton itemName="＋ 行を追加" onClick={handleAddRow} buttonType="cancel" />
          </div>
          <div style={{ marginTop: 10, textAlign: "right", fontSize: "1.2rem" }}>
            <b>合計金額：{total.toLocaleString()}</b>
          </div>
        </Grid>

        <Grid item xs={12}>
          <div className="section-item">
            <label className="section-label">備考</label>
            <textarea
              value={latestData.note}
              onChange={(e) => setLatestData((v) => ({ ...v, note: e.target.value }))}
              className="section-input"
            ></textarea>
          </div>
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

export default PurchaseOrderIntakeUpload;
