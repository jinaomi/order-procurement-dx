import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import { Grid, Chip } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import purchaseInvoiceService from "../services/purchaseInvoiceService";
import purchaseOrderService from "../services/purchaseOrderService";

const statusColor = { Recorded: "info", Paid: "success" };
const statusLabel = { Recorded: "記録済み", Paid: "支払済み" };

const PurchaseInvoiceDetail = ({ purchaseInvoiceId }) => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  // Create mode
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [note, setNote] = useState("");

  // View mode
  const [viewData, setViewData] = useState(null);

  useEffect(async () => {
    if (purchaseInvoiceId) {
      await getPurchaseInvoiceDetail();
    } else {
      await loadPurchaseOrders();
    }
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const response = await purchaseOrderService.getAll(axiosPrivate, null, null, null, null, 1000, 1);
      const eligible = (response.data.items || []).filter((po) => po.status !== "Cancelled");
      setPurchaseOrders(eligible.map((po) => ({ ...po, label: po.purchaseOrderNumber })));
    } catch (error) {
      setPurchaseOrders([]);
    }
  };

  const getPurchaseInvoiceDetail = async () => {
    setLoading(true);
    try {
      const response = await purchaseInvoiceService.getById(axiosPrivate, purchaseInvoiceId);
      setViewData(response.data);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleSelectPurchaseOrder = (po) => {
    setSelectedPurchaseOrderId(po ? po.id : null);
    setSelectedPurchaseOrder(po || null);
  };

  const validateForm = () => {
    let newErrors = {};
    if (!selectedPurchaseOrderId) {
      newErrors.purchaseOrderId = "発注を選択してください。";
    }
    if (!issueDate) {
      newErrors.issueDate = "発行日は必須項目です。";
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
      purchaseOrderId: selectedPurchaseOrderId,
      issueDate,
      supplierInvoiceNumber: supplierInvoiceNumber || null,
      note,
    };

    try {
      await purchaseInvoiceService.create(axiosPrivate, payload);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "仕入請求書の登録は正常に完了しました！",
      });
      setSelectedPurchaseOrderId(null);
      setSelectedPurchaseOrder(null);
      setSupplierInvoiceNumber("");
      setNote("");
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      await purchaseInvoiceService.pay(axiosPrivate, viewData.id);
      setSnackbar({ isOpen: true, status: "success", message: "支払済みに更新しました。" });
      await getPurchaseInvoiceDetail();
    } catch (error) {
      setSnackbar({ isOpen: true, status: "error", message: "更新に失敗しました。" });
    }
    setLoading(false);
  };

  if (purchaseInvoiceId) {
    return (
      <section className="purchase-invoice">
        {viewData && (
          <Grid container columnSpacing={5} rowSpacing={3}>
            <Grid item xs={12}>
              <b>仕入請求書番号：</b> {viewData.purchaseInvoiceNumber} &nbsp;&nbsp;
              <b>発注番号：</b> {viewData.purchaseOrderNumber} &nbsp;&nbsp;
              <b>仕入先：</b> {viewData.supplierName}
            </Grid>
            <Grid item xs={12}>
              <b>ステータス：</b>{" "}
              <Chip
                label={statusLabel[viewData.status] || viewData.status}
                color={statusColor[viewData.status] || "default"}
                size="small"
              />
            </Grid>
            <Grid item xs={4}>
              <b>発行日：</b> {viewData.issueDate ? viewData.issueDate.slice(0, 10) : ""}
            </Grid>
            <Grid item xs={4}>
              <b>支払期日：</b> {viewData.dueDate ? viewData.dueDate.slice(0, 10) : ""}
            </Grid>
            <Grid item xs={4}>
              <b>合計金額：</b> {viewData.totalAmount != null ? viewData.totalAmount.toLocaleString() : ""}
            </Grid>
            {viewData.supplierInvoiceNumber && (
              <Grid item xs={12}>
                <b>仕入先請求書番号：</b> {viewData.supplierInvoiceNumber}
              </Grid>
            )}
            {viewData.note && (
              <Grid item xs={12}>
                <b>備考：</b> {viewData.note}
              </Grid>
            )}
            {viewData.status !== "Paid" && (
              <Grid item xs={12}>
                <FormButton itemName="支払い確認" onClick={handleMarkPaid} />
              </Grid>
            )}
          </Grid>
        )}
        <LoadingSpinner loading={loading}></LoadingSpinner>
        <FormSnackbar item={snackbar} setItem={setSnackbar} />
      </section>
    );
  }

  return (
    <section className="purchase-invoice">
      <form onSubmit={onSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">
                発注<span className="required-icon"> *</span>
              </label>
              <FormSelection
                value={purchaseOrders.find((p) => p.id === selectedPurchaseOrderId) || null}
                options={purchaseOrders}
                optionSelected={(e, value) => handleSelectPurchaseOrder(value)}
              />
              <errors>{errors.purchaseOrderId}</errors>
            </div>
          </Grid>
          <Grid item xs={3}>
            <div className="section-item">
              <label className="section-label">
                発行日<span className="required-icon"> *</span>
              </label>
              <input
                type="date"
                className="section-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <errors>{errors.issueDate}</errors>
            </div>
          </Grid>
          {selectedPurchaseOrder && (
            <Grid item xs={3}>
              <div className="section-item">
                <label className="section-label">発注金額</label>
                <div style={{ padding: "0.5rem 0" }}>
                  {selectedPurchaseOrder.totalAmount != null
                    ? selectedPurchaseOrder.totalAmount.toLocaleString()
                    : ""}
                </div>
              </div>
            </Grid>
          )}
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">仕入先請求書番号</label>
              <input
                type="text"
                className="section-input"
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              />
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className="section-item">
              <label className="section-label">備考</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="section-input"
              ></textarea>
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className="handle-button">
              <FormButton itemName="登録" type="submit" />
            </div>
          </Grid>
        </Grid>
      </form>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default PurchaseInvoiceDetail;
