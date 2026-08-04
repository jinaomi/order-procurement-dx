import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import ContentDialog from "./until/ContentDialog.js";
import PurchaseOrderDetail from "./PurchaseOrderDetail.js";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import reorderSuggestionService from "../services/reorderSuggestionService";
import {
  Button,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import FormSnackbar from "./until/FormSnackbar.js";

const flagLabel = {
  UrgentReorder: "至急発注",
  PlanAhead: "計画的発注",
  OnTrack: "発注済み・順調",
  NoHistory: "データ不足",
};

const flagColor = {
  UrgentReorder: "error",
  PlanAhead: "warning",
  OnTrack: "success",
  NoHistory: "default",
};

const flagOrder = { UrgentReorder: 0, PlanAhead: 1, OnTrack: 2, NoHistory: 3 };

const flagDescription = {
  UrgentReorder: "在庫切れ予測日までに発注が間に合わない可能性があります。至急発注をご検討ください。",
  PlanAhead: "現時点では在庫に余裕がありますが、計画的な発注をお勧めします。",
  OnTrack: "すでに発注済みで、入荷予定日は在庫切れ予測日より前です。",
  NoHistory: "販売実績が少ないため、発注提案を算出できませんでした。",
};

const FLAG_SEQUENCE = ["UrgentReorder", "PlanAhead", "OnTrack", "NoHistory"];

const ReorderSuggestions = () => {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });

  useEffect(async () => {
    await getSuggestions();
  }, []);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const response = await reorderSuggestionService.get(axiosPrivate, false);
      const sorted = [...(response.data || [])].sort(
        (a, b) => (flagOrder[a.flag] ?? 9) - (flagOrder[b.flag] ?? 9)
      );
      setSuggestions(sorted.map((item) => ({ ...item, aiReasoningLoaded: false })));
    } catch (error) {
      setSuggestions([]);
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  const handleGenerateAiReasoning = async (productId) => {
    setLoadingProductId(productId);
    try {
      const response = await reorderSuggestionService.getReasoning(axiosPrivate, productId);
      setSuggestions((value) =>
        value.map((item) =>
          item.productId === productId
            ? { ...item, reasoning: response.data.reasoning, aiReasoningLoaded: true }
            : item
        )
      );
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "AIによる理由の生成に失敗しました。",
      });
    }
    setLoadingProductId(null);
  };

  const handleCreatePurchaseOrder = (item) => {
    setInitialData({
      supplierId: item.suggestedSupplierId,
      productId: item.productId,
      productNameRaw: item.productName,
      quantity: item.suggestedQuantity || 1,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  return (
    <section>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <span style={{ fontSize: "0.85rem", color: "#555" }}>
            「理由」列は定型文です。商品ごとに「AIで生成」を押すと、その商品だけ具体的な理由をAIが生成します（Anthropic APIを呼び出します）。
          </span>
        </Grid>
        {suggestions.length === 0 && (
          <Grid item xs={12}>
            <span style={{ color: "#000" }}>現在、発注が必要な商品はありません。</span>
          </Grid>
        )}
        {FLAG_SEQUENCE.map((flag) => {
          const group = suggestions.filter((item) => item.flag === flag);
          if (group.length === 0) {
            return null;
          }
          const aiApplicable = flag === "UrgentReorder" || flag === "PlanAhead";
          return (
            <Grid item xs={12} key={flag}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Chip label={flagLabel[flag] || flag} color={flagColor[flag] || "default"} />
                <span style={{ fontSize: "0.9rem", color: "#333" }}>{group.length}件</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: 8 }}>
                {flagDescription[flag]}
              </div>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 900 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>商品名</TableCell>
                      <TableCell style={{ textAlign: "center" }}>現在庫</TableCell>
                      <TableCell style={{ textAlign: "center" }}>在庫切れ予測日</TableCell>
                      <TableCell style={{ textAlign: "center" }}>発注期限</TableCell>
                      <TableCell style={{ textAlign: "center" }}>提案数量</TableCell>
                      <TableCell style={{ textAlign: "center" }}>提案仕入先</TableCell>
                      <TableCell style={{ textAlign: "center" }}>AIコメント</TableCell>
                      <TableCell style={{ textAlign: "center" }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>{item.currentStock}</TableCell>
                        <TableCell>
                          {item.projectedStockoutDate ? item.projectedStockoutDate.slice(0, 10) : "-"}
                        </TableCell>
                        <TableCell>
                          {item.suggestedOrderByDate ? item.suggestedOrderByDate.slice(0, 10) : "-"}
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          {item.suggestedQuantity != null ? item.suggestedQuantity : "-"}
                        </TableCell>
                        <TableCell>{item.suggestedSupplierName || "-"}</TableCell>
                        <TableCell style={{ maxWidth: 260 }}>
                          {item.aiReasoningLoaded ? (
                            item.reasoning
                          ) : aiApplicable ? (
                            <Button
                              size="small"
                              variant="text"
                              disabled={loadingProductId === item.productId}
                              onClick={() => handleGenerateAiReasoning(item.productId)}
                              style={{ padding: 0, minWidth: 0 }}
                            >
                              {loadingProductId === item.productId ? "生成中..." : "AIで生成"}
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell style={{ textAlign: "center" }}>
                          {aiApplicable && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleCreatePurchaseOrder(item)}
                              style={{ margin: "1px 5px" }}
                            >
                              発注書を作成
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          );
        })}
      </Grid>

      <LoadingSpinner loading={loading}></LoadingSpinner>
      <ContentDialog open={showDialog} closeDialog={closeDialog}>
        <PurchaseOrderDetail purchaseOrderId={undefined} initialData={initialData}></PurchaseOrderDetail>
      </ContentDialog>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default ReorderSuggestions;
