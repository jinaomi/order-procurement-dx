import { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import LoadingSpinner from "./until/LoadingSpinner";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import dashboardService from "../services/dashboardService";
import "../styles/styles.css";

const AI_ACCENT_COLOR = "#b85a25";

const statusColor = {
  Draft: "default",
  Confirmed: "success",
  RiskFlagged: "warning",
  Invoiced: "info",
  Cancelled: "error",
};

const statusChartColor = {
  Draft: "#9e9e9e",
  Confirmed: "#2e7d32",
  RiskFlagged: "#ed6c02",
  Invoiced: "#0288d1",
  Cancelled: "#c62828",
};

const StatTile = ({ label, value, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{ color: color || "#11596F", fontWeight: "bold", fontSize: { xs: "1.6rem" } }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AiCommentCard = () => {
  const [comment, setComment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const axiosPrivate = useAxiosPrivate();

  const generateComment = async () => {
    setLoading(true);
    setRequested(true);
    try {
      const response = await dashboardService.getAiComment(axiosPrivate);
      setComment(response.data || null);
    } catch (error) {
      setComment(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    );
  }

  if (!requested) {
    return (
      <Card>
        <CardContent
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <AutoAwesomeIcon style={{ color: AI_ACCENT_COLOR }} />
            AIによる経営コメントを生成できます（API利用のため、クリックした時のみ実行されます）
          </Typography>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon style={{ color: AI_ACCENT_COLOR }} />} onClick={generateComment}>
            AI経営コメントを生成
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!comment) {
    return (
      <Card>
        <CardContent
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="body2" color="text.secondary">
            コメントの生成に失敗しました。
          </Typography>
          <Button variant="text" onClick={generateComment}>
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <AutoAwesomeIcon style={{ color: AI_ACCENT_COLOR }} /> AI経営コメント
          </Typography>
          <Button size="small" variant="text" startIcon={<AutoAwesomeIcon style={{ color: AI_ACCENT_COLOR }} />} onClick={generateComment}>
            再生成
          </Button>
        </div>
        <Typography variant="subtitle1" style={{ fontWeight: "bold" }} gutterBottom>
          {comment.headline}
        </Typography>
        <List dense>
          {comment.highlights.map((h, i) => (
            <ListItem key={i} style={{ display: "list-item", listStyleType: "disc", marginLeft: 20, padding: 0 }}>
              <ListItemText primary={h} />
            </ListItem>
          ))}
        </List>
        {comment.recommendation && (
          <Alert severity="info" style={{ marginTop: 10 }}>
            {comment.recommendation}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const SalesDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();

  useEffect(async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getSummary(axiosPrivate);
      setSummary(response.data);
    } catch (error) {
      setSummary(null);
    }
    setLoading(false);
  }, []);

  if (!summary) {
    return <LoadingSpinner loading={loading}></LoadingSpinner>;
  }

  return (
    <section>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AiCommentCard />
        </Grid>

        <Grid item xs={12}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            <StatTile label="受注件数" value={summary.totalOrders} />
            <StatTile
              label="受注金額合計"
              value={`¥${summary.totalOrderAmount.toLocaleString()}`}
            />
            <StatTile
              label="請求済み金額"
              value={`¥${summary.totalInvoicedAmount.toLocaleString()}`}
              color="#0B78D1"
            />
            <StatTile
              label="リスクあり受注件数"
              value={summary.riskFlaggedCount}
              color={summary.riskFlaggedCount > 0 ? "#c62828" : "#11596F"}
            />
          </div>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                受注ステータス内訳
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  {summary.orderFunnel.map((s) => (
                    <Chip
                      key={s.status}
                      label={`${s.status}: ${s.count}件`}
                      color={statusColor[s.status] || "default"}
                      style={{ marginRight: 10, marginBottom: 5 }}
                    />
                  ))}
                </Grid>
                <Grid item xs={12} md={7}>
                  <PieChart
                    height={220}
                    series={[
                      {
                        data: summary.orderFunnel.map((s) => ({
                          id: s.status,
                          value: s.count,
                          label: s.status,
                          color: statusChartColor[s.status] || "#9e9e9e",
                        })),
                        innerRadius: 40,
                        paddingAngle: 2,
                      },
                    ]}
                    slotProps={{ legend: { hidden: true } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                月別売上
              </Typography>
              <LineChart
                height={260}
                xAxis={[{ scaleType: "point", data: summary.monthlySales.map((m) => m.month) }]}
                series={[
                  {
                    data: summary.monthlySales.map((m) => m.totalAmount),
                    label: "売上金額",
                    color: "#0B78D1",
                    valueFormatter: (v) => `¥${v.toLocaleString()}`,
                  },
                ]}
              />
              <div style={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>年月</TableCell>
                      <TableCell style={{ textAlign: "right" }}>受注件数</TableCell>
                      <TableCell style={{ textAlign: "right" }}>金額</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.monthlySales.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell>{m.month}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>{m.orderCount}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          ¥{m.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                取引先別売上 TOP5
              </Typography>
              <BarChart
                height={260}
                layout="horizontal"
                yAxis={[
                  {
                    scaleType: "band",
                    data: summary.topCustomers.map((c) => c.customerName),
                    tickLabelStyle: { fontSize: 11 },
                  },
                ]}
                series={[
                  {
                    data: summary.topCustomers.map((c) => c.totalAmount),
                    label: "売上金額",
                    color: "#11596F",
                    valueFormatter: (v) => `¥${v.toLocaleString()}`,
                  },
                ]}
                margin={{ left: 170 }}
              />
              <div style={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>取引先</TableCell>
                      <TableCell style={{ textAlign: "right" }}>受注件数</TableCell>
                      <TableCell style={{ textAlign: "right" }}>金額</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topCustomers.map((c) => (
                      <TableRow key={c.customerName}>
                        <TableCell style={{ whiteSpace: "nowrap" }}>{c.customerName}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>{c.orderCount}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          ¥{c.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                商品別売上 TOP5
              </Typography>
              <BarChart
                height={280}
                xAxis={[{ scaleType: "band", data: summary.topProducts.map((p) => p.productName) }]}
                series={[
                  {
                    data: summary.topProducts.map((p) => p.totalAmount),
                    label: "売上金額",
                    color: "#0B78D1",
                    valueFormatter: (v) => `¥${v.toLocaleString()}`,
                  },
                ]}
              />
              <div style={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>商品名</TableCell>
                      <TableCell style={{ textAlign: "right" }}>数量</TableCell>
                      <TableCell style={{ textAlign: "right" }}>金額</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.topProducts.map((p) => (
                      <TableRow key={p.productName}>
                        <TableCell style={{ whiteSpace: "nowrap" }}>{p.productName}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>{p.totalQuantity}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          ¥{p.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <LoadingSpinner loading={loading}></LoadingSpinner>
    </section>
  );
};

export default SalesDashboard;
