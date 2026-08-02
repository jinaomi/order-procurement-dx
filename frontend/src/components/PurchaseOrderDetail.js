import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import CustomFieldsSection from "./until/CustomFieldsSection";
import DialogHandle from "./until/DialogHandle";
import ContentDialog from "./until/ContentDialog";
import AttachedFilesList from "./until/AttachedFilesList";
import PurchaseInvoiceDetail from "./PurchaseInvoiceDetail";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Button,
} from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import purchaseOrderService from "../services/purchaseOrderService";
import supplierService from "../services/supplierService";
import productService from "../services/productService";
import templateService from "../services/templateService";
import * as Icons from "@mui/icons-material";
import { Chip, Alert } from "@mui/material";

const statusColor = {
  Draft: "default",
  Confirmed: "success",
  PartiallyReceived: "warning",
  Received: "info",
  Cancelled: "error",
};

const emptyRow = () => ({
  key: Math.random().toString(36).slice(2),
  productId: null,
  productNameRaw: "",
  quantity: 1,
  unitPrice: 0,
});

const PurchaseOrderDetail = ({ purchaseOrderId, initialData }) => {
  const [latestData, setLatestData] = useState({
    supplierId: null,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: "",
    note: "",
  });
  const [items, setItems] = useState([emptyRow()]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataId, setDataId] = useState();
  const [purchaseOrderInfo, setPurchaseOrderInfo] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [optionFileType, setOptionFileType] = useState([]);
  const [attachFileTypeId, setAttachFileTypeId] = useState(null);
  const [attachRefreshToken, setAttachRefreshToken] = useState(0);
  const axiosPrivate = useAxiosPrivate();
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  useEffect(async () => {
    await loadOptions();
    if (purchaseOrderId) {
      await getPurchaseOrderDetail();
    } else if (initialData) {
      setLatestData((v) => ({ ...v, supplierId: initialData.supplierId || null }));
      setItems([
        {
          key: Math.random().toString(36).slice(2),
          productId: initialData.productId || null,
          productNameRaw: initialData.productNameRaw || "",
          quantity: initialData.quantity || 1,
          unitPrice: initialData.unitPrice || 0,
        },
      ]);
    }
  }, []);

  const loadOptions = async () => {
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
    try {
      const templateResponse = await templateService.getModuleTemplate(axiosPrivate, "PurchaseOrder");
      setCustomFields(templateResponse.data?.keywords || []);
    } catch (error) {
      setCustomFields([]);
    }
  };

  const getPurchaseOrderDetail = async (id) => {
    const targetId = id || dataId || purchaseOrderId;
    setLoading(true);
    try {
      const response = await purchaseOrderService.getById(axiosPrivate, targetId);
      const data = response.data;
      setDataId(data.id);
      setPurchaseOrderInfo(data);
      setLatestData({
        supplierId: data.supplierId,
        orderDate: data.orderDate ? data.orderDate.slice(0, 10) : "",
        expectedDeliveryDate: data.expectedDeliveryDate
          ? data.expectedDeliveryDate.slice(0, 10)
          : "",
        note: data.note || "",
      });
      setItems(
        (data.purchaseOrderItems || []).map((i) => ({
          key: i.id,
          productId: i.productId,
          productNameRaw: i.productNameRaw,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          receivedQuantity: i.receivedQuantity,
        }))
      );
      setCustomFieldValues(
        (data.customFieldValues || []).map((v) => ({
          keywordId: v.keywordId,
          value: v.value,
        }))
      );
      await getReconciliation(data.id);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleAttach = async () => {
    try {
      const response = await axiosPrivate.get("/api/Type/file-type");
      const options = (response.data || []).map((item) => ({ id: item.id, label: item.name }));
      setOptionFileType(options);
      setAttachFileTypeId((options.find((t) => t.label === "発注書") || {}).id || null);
    } catch (error) {
      setOptionFileType([]);
    }
    setShowAttachDialog(true);
  };

  const closeAttachDialog = () => {
    setShowAttachDialog(false);
    setAttachRefreshToken((v) => v + 1);
  };

  const getReconciliation = async (currentPurchaseOrderId) => {
    try {
      const response = await purchaseOrderService.getReconciliation(axiosPrivate, currentPurchaseOrderId);
      setReconciliation(response.data);
    } catch (error) {
      setReconciliation(null);
    }
  };

  const handleOpenInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceDialog(true);
  };

  const closeInvoiceDialog = () => {
    setShowInvoiceDialog(false);
    if (dataId) {
      getReconciliation(dataId);
    }
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

  const onSubmit = async (e) => {
    e.preventDefault();
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
      sourceType: "Manual",
      purchaseOrderItems: items.map((i) => ({
        productId: i.productId,
        productNameRaw: i.productNameRaw,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
      customFieldValues,
    };

    try {
      if (dataId) {
        await purchaseOrderService.update(axiosPrivate, dataId, payload);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "発注情報の更新は正常に完了しました!",
        });
        await getPurchaseOrderDetail();
      } else {
        const response = await purchaseOrderService.create(axiosPrivate, payload);
        setDataId(response.data);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "発注の登録は正常に完了しました！",
        });
        await getPurchaseOrderDetail(response.data);
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

  const handleClear = () => {
    setDataId();
    setPurchaseOrderInfo(null);
    setReconciliation(null);
    setLatestData({
      supplierId: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: "",
      note: "",
    });
    setItems([emptyRow()]);
    setCustomFieldValues([]);
  };

  const total = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );

  return (
    <section className="purchase-order">
      <form onSubmit={onSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          {purchaseOrderInfo && (
            <Grid item xs={12}>
              <b>発注番号：</b> {purchaseOrderInfo.purchaseOrderNumber} &nbsp;&nbsp;
              <b>ステータス：</b>{" "}
              <Chip
                label={purchaseOrderInfo.status}
                color={statusColor[purchaseOrderInfo.status] || "default"}
                size="small"
              />
            </Grid>
          )}
          {reconciliation && (
            <Grid item xs={12}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <b>対応状況：</b>
                <Chip label="発注済み" color="success" size="small" />
                <Chip
                  label={
                    reconciliation.isFullyReceived
                      ? "入荷済み（全部）"
                      : reconciliation.isPartiallyReceived
                      ? "入荷済み（一部）"
                      : "未入荷"
                  }
                  color={
                    reconciliation.isFullyReceived
                      ? "success"
                      : reconciliation.isPartiallyReceived
                      ? "warning"
                      : "default"
                  }
                  size="small"
                />
                <Chip
                  label={reconciliation.isInvoiceReceived ? "請求受領済み" : "請求未受領"}
                  color={reconciliation.isInvoiceReceived ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={reconciliation.isFullyPaid ? "支払済み" : "未払い"}
                  color={reconciliation.isFullyPaid ? "success" : "default"}
                  size="small"
                />
              </div>
              {reconciliation.hasAmountMismatch && (
                <>
                  <Alert severity="warning" style={{ marginTop: 10 }}>
                    発注金額（¥{reconciliation.orderedTotalAmount.toLocaleString()}）に対し、請求金額の合計は¥
                    {reconciliation.invoicedTotalAmount.toLocaleString()}で、¥
                    {Math.abs(
                      reconciliation.invoicedTotalAmount - reconciliation.orderedTotalAmount
                    ).toLocaleString()}
                    {reconciliation.invoicedTotalAmount > reconciliation.orderedTotalAmount
                      ? "超過"
                      : "不足"}
                    しています。下記の請求書をご確認ください。
                  </Alert>
                  <Table size="small" style={{ marginTop: 10 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>請求書番号</TableCell>
                        <TableCell style={{ textAlign: "right" }}>金額</TableCell>
                        <TableCell>ステータス</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reconciliation.invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.purchaseInvoiceNumber}</TableCell>
                          <TableCell style={{ textAlign: "right" }}>
                            ¥{inv.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={inv.status === "Paid" ? "支払済み" : "未払い"}
                              color={inv.status === "Paid" ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<Icons.Visibility />}
                              onClick={() => handleOpenInvoice(inv.id)}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Grid>
          )}
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">
                仕入先<span className="required-icon"> *</span>
              </label>
              <FormSelection
                value={suppliers.find((s) => s.id === latestData.supplierId) || null}
                options={suppliers}
                optionSelected={(e, value) =>
                  setLatestData((v) => ({ ...v, supplierId: value ? value.id : null }))
                }
              />
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
                onChange={(e) =>
                  setLatestData((v) => ({ ...v, orderDate: e.target.value }))
                }
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
                  {purchaseOrderInfo && <TableCell style={{ width: "12%" }}>入荷済み</TableCell>}
                  <TableCell style={{ width: "5%" }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.key}>
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
                    {purchaseOrderInfo && (
                      <TableCell>
                        {item.receivedQuantity != null ? item.receivedQuantity : 0}
                      </TableCell>
                    )}
                    <TableCell>
                      <IconButton onClick={() => handleRemoveRow(item.key)} size="small">
                        <Icons.Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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

          <CustomFieldsSection
            fields={customFields}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />
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
              <FormButton itemName="保存" type="submit" />
              <FormButton itemName="新規作成" onClick={handleClear} />
              <FormButton
                itemName="関連書類の添付"
                buttonType="attach"
                titleContent={!dataId ? "発注を保存してから書類の添付や管理が行えます。" : ""}
                onClick={handleAttach}
                disabled={!dataId}
              />
            </div>
          </Grid>
          {dataId && (
            <Grid item xs={12}>
              <AttachedFilesList
                entityType="PurchaseOrder"
                entityId={dataId}
                refreshToken={attachRefreshToken}
              />
            </Grid>
          )}
        </Grid>
      </form>
      <DialogHandle
        open={showAttachDialog}
        closeDialog={closeAttachDialog}
        title="関連書類の添付"
        optionFileType={optionFileType}
        entityType="PurchaseOrder"
        entityId={dataId}
        fixedFileTypeId={attachFileTypeId}
      />
      <ContentDialog
        open={showInvoiceDialog}
        closeDialog={closeInvoiceDialog}
        title="仕入請求書詳細"
      >
        <PurchaseInvoiceDetail purchaseInvoiceId={selectedInvoiceId}></PurchaseInvoiceDetail>
      </ContentDialog>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default PurchaseOrderDetail;
