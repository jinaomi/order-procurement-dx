import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import DialogHandle from "./until/DialogHandle";
import AttachedFilesList from "./until/AttachedFilesList";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow, Alert } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import goodsReceiptService from "../services/goodsReceiptService";
import purchaseOrderService from "../services/purchaseOrderService";

const RECEIVABLE_STATUSES = ["Confirmed", "PartiallyReceived"];

const GoodsReceiptDetail = ({ goodsReceiptId }) => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState([]);

  // Create mode state
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [items, setItems] = useState([]);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);

  // View-only mode state
  const [viewData, setViewData] = useState(null);

  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [optionFileType, setOptionFileType] = useState([]);
  const [attachFileTypeId, setAttachFileTypeId] = useState(null);
  const [attachRefreshToken, setAttachRefreshToken] = useState(0);

  const handleAttach = async () => {
    try {
      const response = await axiosPrivate.get("/api/Type/file-type");
      const options = (response.data || []).map((item) => ({ id: item.id, label: item.name }));
      setOptionFileType(options);
      setAttachFileTypeId((options.find((t) => t.label === "納品書") || {}).id || null);
    } catch (error) {
      setOptionFileType([]);
    }
    setShowAttachDialog(true);
  };

  const closeAttachDialog = () => {
    setShowAttachDialog(false);
    setAttachRefreshToken((v) => v + 1);
  };

  useEffect(async () => {
    if (goodsReceiptId) {
      await getGoodsReceiptDetail();
    } else {
      await loadPurchaseOrders();
    }
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const response = await purchaseOrderService.getAll(axiosPrivate, null, null, null, null, 1000, 1);
      const eligible = (response.data.items || []).filter((po) =>
        RECEIVABLE_STATUSES.includes(po.status)
      );
      setPurchaseOrders(eligible.map((po) => ({ ...po, label: po.purchaseOrderNumber })));
    } catch (error) {
      setPurchaseOrders([]);
    }
  };

  const getGoodsReceiptDetail = async () => {
    setLoading(true);
    try {
      const response = await goodsReceiptService.getById(axiosPrivate, goodsReceiptId);
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

  const handleSelectPurchaseOrder = async (purchaseOrder) => {
    setSelectedPurchaseOrderId(purchaseOrder ? purchaseOrder.id : null);
    if (!purchaseOrder) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await purchaseOrderService.getById(axiosPrivate, purchaseOrder.id);
      const data = response.data;
      setItems(
        (data.purchaseOrderItems || []).map((i) => {
          const remaining = Number(i.quantity) - Number(i.receivedQuantity || 0);
          return {
            purchaseOrderItemId: i.id,
            productId: i.productId,
            productNameRaw: i.productNameRaw,
            orderedQuantity: i.quantity,
            alreadyReceived: i.receivedQuantity || 0,
            receivedQuantity: remaining > 0 ? remaining : 0,
          };
        })
      );
    } catch (error) {
      setItems([]);
    }
    setLoading(false);
  };

  const handleItemChange = (purchaseOrderItemId, value) => {
    setItems((value2) =>
      value2.map((i) =>
        i.purchaseOrderItemId === purchaseOrderItemId ? { ...i, receivedQuantity: value } : i
      )
    );
  };

  const validateForm = () => {
    let newErrors = {};
    if (!selectedPurchaseOrderId) {
      newErrors.purchaseOrderId = "発注を選択してください。";
    }
    if (!receivedDate) {
      newErrors.receivedDate = "入荷日は必須項目です。";
    }
    if (items.filter((i) => Number(i.receivedQuantity) > 0).length === 0) {
      newErrors.items = "入荷数量を1件以上入力してください。";
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
      receivedDate,
      sourceType: "Manual",
      note,
      goodsReceiptItems: items
        .filter((i) => Number(i.receivedQuantity) > 0)
        .map((i) => ({
          purchaseOrderItemId: i.purchaseOrderItemId,
          productId: i.productId,
          productNameRaw: i.productNameRaw,
          receivedQuantity: Number(i.receivedQuantity),
        })),
    };

    try {
      const response = await goodsReceiptService.create(axiosPrivate, payload);
      setCreatedInfo(response.data);
      setWarnings(response.data.overDeliveryWarnings || []);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "入荷登録は正常に完了しました！",
      });
      setSelectedPurchaseOrderId(null);
      setItems([]);
      setNote("");
      await loadPurchaseOrders();
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  if (goodsReceiptId) {
    return (
      <section className="goods-receipt">
        {viewData && (
          <Grid container columnSpacing={5} rowSpacing={3}>
            <Grid item xs={12}>
              <b>入荷番号：</b> {viewData.goodsReceiptNumber} &nbsp;&nbsp;
              <b>発注番号：</b> {viewData.purchaseOrderNumber} &nbsp;&nbsp;
              <b>仕入先：</b> {viewData.supplierName}
            </Grid>
            <Grid item xs={12}>
              <b>入荷日：</b> {viewData.receivedDate ? viewData.receivedDate.slice(0, 10) : ""}
            </Grid>
            <Grid item xs={12}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>商品</TableCell>
                    <TableCell>入荷数量</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(viewData.goodsReceiptItems || []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.productNameRaw}</TableCell>
                      <TableCell>{i.receivedQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>
            {viewData.note && (
              <Grid item xs={12}>
                <b>備考：</b> {viewData.note}
              </Grid>
            )}
            <Grid item xs={12}>
              <div className="handle-button">
                <FormButton itemName="関連書類の添付" buttonType="attach" onClick={handleAttach} />
              </div>
            </Grid>
            <Grid item xs={12}>
              <AttachedFilesList
                entityType="GoodsReceipt"
                entityId={goodsReceiptId}
                refreshToken={attachRefreshToken}
              />
            </Grid>
          </Grid>
        )}
        <DialogHandle
          open={showAttachDialog}
          closeDialog={closeAttachDialog}
          title="関連書類の添付"
          optionFileType={optionFileType}
          entityType="GoodsReceipt"
          entityId={goodsReceiptId}
          fixedFileTypeId={attachFileTypeId}
        />
        <LoadingSpinner loading={loading}></LoadingSpinner>
        <FormSnackbar item={snackbar} setItem={setSnackbar} />
      </section>
    );
  }

  return (
    <section className="goods-receipt">
      <form onSubmit={onSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          {createdInfo && warnings.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                {warnings.map((w, idx) => (
                  <div key={idx}>{w}</div>
                ))}
              </Alert>
            </Grid>
          )}
          {createdInfo && (
            <Grid item xs={12}>
              <Alert severity="success" action={<FormButton itemName="関連書類の添付" buttonType="attach" onClick={handleAttach} />}>
                入荷を登録しました。納品書の写真などを添付できます。
              </Alert>
            </Grid>
          )}
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

          {items.length > 0 && (
            <Grid item xs={12}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>商品</TableCell>
                    <TableCell style={{ width: "12%" }}>発注数量</TableCell>
                    <TableCell style={{ width: "12%" }}>入荷済み</TableCell>
                    <TableCell style={{ width: "15%" }}>今回の入荷数量</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.purchaseOrderItemId}>
                      <TableCell>{item.productNameRaw}</TableCell>
                      <TableCell>{item.orderedQuantity}</TableCell>
                      <TableCell>{item.alreadyReceived}</TableCell>
                      <TableCell>
                        <input
                          type="number"
                          className="section-input"
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            handleItemChange(item.purchaseOrderItemId, e.target.value)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <errors>{errors.items}</errors>
            </Grid>
          )}

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
          {createdInfo && (
            <Grid item xs={12}>
              <AttachedFilesList
                entityType="GoodsReceipt"
                entityId={createdInfo.goodsReceiptId}
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
        entityType="GoodsReceipt"
        entityId={createdInfo ? createdInfo.goodsReceiptId : null}
        fixedFileTypeId={attachFileTypeId}
      />
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default GoodsReceiptDetail;
