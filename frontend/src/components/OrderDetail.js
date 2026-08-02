import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormSelection from "./until/FormSelection";
import CustomFieldsSection from "./until/CustomFieldsSection";
import DialogHandle from "./until/DialogHandle";
import AttachedFilesList from "./until/AttachedFilesList";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import orderService from "../services/orderService";
import productService from "../services/productService";
import invoiceService from "../services/invoiceService";
import aiMatchingService from "../services/aiMatchingService";
import templateService from "../services/templateService";
import * as Icons from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";

const statusColor = {
  Draft: "default",
  Confirmed: "success",
  RiskFlagged: "warning",
  Invoiced: "info",
  Cancelled: "error",
};

const statusLabel = {
  Draft: "下書き",
  Confirmed: "確定",
  RiskFlagged: "リスクあり",
  Invoiced: "請求済み",
  Cancelled: "キャンセル",
};

const invoiceStatusLabel = {
  Issued: "発行済み",
  Paid: "入金済み",
};

const riskColor = {
  Sufficient: "success",
  Warning: "warning",
  Insufficient: "error",
};

const riskLabel = {
  Sufficient: "在庫十分",
  Warning: "要注意",
  Insufficient: "不足",
};

const emptyRow = () => ({
  key: Math.random().toString(36).slice(2),
  productId: null,
  productNameRaw: "",
  quantity: 1,
  unitPrice: 0,
});

const OrderDetail = ({ orderId }) => {
  const [latestData, setLatestData] = useState({
    customerId: null,
    orderDate: new Date().toISOString().slice(0, 10),
    requestedDeliveryDate: "",
    note: "",
  });
  const [items, setItems] = useState([emptyRow()]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataId, setDataId] = useState();
  const [orderInfo, setOrderInfo] = useState(null);
  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);
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
    if (orderId) {
      await getOrderDetail();
    }
  }, []);

  const loadOptions = async () => {
    try {
      const customerResponse = await axiosPrivate.get(
        "/api/Customer/getAll?pageSize=1000&pageNumber=1"
      );
      setCustomers(customerResponse.data.items || []);
    } catch (error) {
      setCustomers([]);
    }
    try {
      const productResponse = await productService.list(axiosPrivate);
      setProducts(productResponse.data || []);
    } catch (error) {
      setProducts([]);
    }
    try {
      const templateResponse = await templateService.getModuleTemplate(axiosPrivate, "Order");
      setCustomFields(templateResponse.data?.keywords || []);
    } catch (error) {
      setCustomFields([]);
    }
  };

  const getOrderDetail = async (id) => {
    const targetId = id || dataId || orderId;
    setLoading(true);
    try {
      const response = await orderService.getById(axiosPrivate, targetId);
      const data = response.data;
      setDataId(data.id);
      setOrderInfo(data);
      setLatestData({
        customerId: data.customerId,
        orderDate: data.orderDate ? data.orderDate.slice(0, 10) : "",
        requestedDeliveryDate: data.requestedDeliveryDate
          ? data.requestedDeliveryDate.slice(0, 10)
          : "",
        note: data.note || "",
      });
      setItems(
        (data.orderItems || []).map((i) => ({
          key: i.id,
          productId: i.productId,
          productNameRaw: i.productNameRaw,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      );
      setCustomFieldValues(
        (data.customFieldValues || []).map((v) => ({
          keywordId: v.keywordId,
          value: v.value,
        }))
      );
      await getInvoiceInfo(data.id);
      await getRiskInfo(data.id);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const getInvoiceInfo = async (currentOrderId) => {
    try {
      const response = await invoiceService.getByOrderId(axiosPrivate, currentOrderId);
      setInvoiceInfo(response.data);
    } catch (error) {
      setInvoiceInfo(null);
    }
  };

  const getRiskInfo = async (currentOrderId) => {
    try {
      const response = await aiMatchingService.getRisk(axiosPrivate, currentOrderId);
      setRiskInfo(response.data);
    } catch (error) {
      setRiskInfo(null);
    }
  };

  const handleRunMatching = async () => {
    setLoading(true);
    try {
      await aiMatchingService.runMatching(axiosPrivate, dataId);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "AI照合を実行しました。",
      });
      await getOrderDetail();
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "AI照合の実行に失敗しました。",
      });
    }
    setLoading(false);
  };

  const handleCreateInvoice = async () => {
    setLoading(true);
    try {
      await invoiceService.createFromOrder(axiosPrivate, dataId);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "請求書を作成しました。",
      });
      await getOrderDetail();
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message:
          error.response?.status === 409
            ? error.response.data
            : "請求書の作成に失敗しました。",
      });
    }
    setLoading(false);
  };

  const handleDownloadInvoice = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.download(axiosPrivate, invoiceInfo.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoiceInfo.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "請求書のダウンロードに失敗しました。",
      });
    }
    setLoading(false);
  };

  const handleAttach = async () => {
    try {
      const response = await axiosPrivate.get("/api/Type/file-type");
      const options = (response.data || []).map((item) => ({ id: item.id, label: item.name }));
      setOptionFileType(options);
      setAttachFileTypeId((options.find((t) => t.label === "受注書") || {}).id || null);
    } catch (error) {
      setOptionFileType([]);
    }
    setShowAttachDialog(true);
  };

  const closeAttachDialog = () => {
    setShowAttachDialog(false);
    setAttachRefreshToken((v) => v + 1);
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
    if (!latestData.customerId) {
      newErrors.customerId = "取引先を選択してください。";
    }
    if (!latestData.orderDate) {
      newErrors.orderDate = "受注日は必須項目です。";
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
      customerId: latestData.customerId,
      orderDate: latestData.orderDate,
      requestedDeliveryDate: latestData.requestedDeliveryDate || null,
      note: latestData.note,
      sourceType: "Manual",
      orderItems: items.map((i) => ({
        productId: i.productId,
        productNameRaw: i.productNameRaw,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
      customFieldValues,
    };

    try {
      if (dataId) {
        await orderService.update(axiosPrivate, dataId, payload);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "受注情報の更新は正常に完了しました!",
        });
        await getOrderDetail();
      } else {
        const response = await orderService.create(axiosPrivate, payload);
        setDataId(response.data);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "受注の登録は正常に完了しました！",
        });
        await getOrderDetail(response.data);
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
    setOrderInfo(null);
    setInvoiceInfo(null);
    setRiskInfo(null);
    setLatestData({
      customerId: null,
      orderDate: new Date().toISOString().slice(0, 10),
      requestedDeliveryDate: "",
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
    <section className="order">
      <form onSubmit={onSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          {orderInfo && (
            <Grid item xs={12}>
              <b>受注番号：</b> {orderInfo.orderNumber} &nbsp;&nbsp;
              <b>ステータス：</b>{" "}
              <Chip
                label={statusLabel[orderInfo.status] || orderInfo.status}
                color={statusColor[orderInfo.status] || "default"}
                size="small"
              />
              <div style={{ marginTop: 10 }}>
                {invoiceInfo ? (
                  <>
                    <span style={{ marginRight: 10 }}>
                      請求書番号: <b>{invoiceInfo.invoiceNumber}</b>（{invoiceStatusLabel[invoiceInfo.status] || invoiceInfo.status}）
                    </span>
                    <FormButton
                      itemName="請求書PDFダウンロード"
                      onClick={handleDownloadInvoice}
                      buttonType="attach"
                    />
                  </>
                ) : orderInfo.status === "Confirmed" ? (
                  <FormButton itemName="請求書作成" onClick={handleCreateInvoice} />
                ) : orderInfo.status === "RiskFlagged" ? (
                  <span style={{ color: "#b26a00" }}>
                    在庫/生産能力の不足が疑われる受注です。請求書を発行する前にご確認ください。
                  </span>
                ) : null}
                {dataId && (
                  <FormButton
                    itemName="再照合（AI）"
                    onClick={handleRunMatching}
                    buttonType="cancel"
                    style={{ marginLeft: 10 }}
                  />
                )}
              </div>
            </Grid>
          )}
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">
                取引先<span className="required-icon"> *</span>
              </label>
              <FormSelection
                value={customers.find((c) => c.id === latestData.customerId) || null}
                options={customers}
                optionSelected={(e, value) =>
                  setLatestData((v) => ({ ...v, customerId: value ? value.id : null }))
                }
              />
              <errors>{errors.customerId}</errors>
            </div>
          </Grid>
          <Grid item xs={3}>
            <div className="section-item">
              <label className="section-label">
                受注日<span className="required-icon"> *</span>
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
              <label className="section-label">納期希望日</label>
              <input
                type="date"
                className="section-input"
                value={latestData.requestedDeliveryDate}
                onChange={(e) =>
                  setLatestData((v) => ({ ...v, requestedDeliveryDate: e.target.value }))
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
                  {riskInfo && <TableCell style={{ width: "15%" }}>AI照合</TableCell>}
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
                    {riskInfo && (
                      <TableCell>
                        {(() => {
                          const line = riskInfo.lines.find((l) => l.orderItemId === item.key);
                          if (!line) return null;
                          return (
                            <Tooltip
                              title={
                                <>
                                  <div>{line.reasoning}</div>
                                  {line.suggestedAction && <div>推奨対応：{line.suggestedAction}</div>}
                                </>
                              }
                            >
                              <Chip
                                label={riskLabel[line.riskLevel] || line.riskLevel}
                                color={riskColor[line.riskLevel] || "default"}
                                size="small"
                              />
                            </Tooltip>
                          );
                        })()}
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
                titleContent={!dataId ? "受注を保存してから書類の添付や管理が行えます。" : ""}
                onClick={handleAttach}
                disabled={!dataId}
              />
            </div>
          </Grid>
          {dataId && (
            <Grid item xs={12}>
              <AttachedFilesList
                entityType="Order"
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
        entityType="Order"
        entityId={dataId}
        fixedFileTypeId={attachFileTypeId}
      />
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default OrderDetail;
