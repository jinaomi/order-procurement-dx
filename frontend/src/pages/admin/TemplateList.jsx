import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import templateService from "../../services/templateService";
import FormSnackbar from "../../components/until/FormSnackbar";
import LoadingSpinner from "../../components/until/LoadingSpinner";

const TemplateList = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "",
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await templateService.getAll(axiosPrivate);
        setTemplates(response.data?.items ?? []);
      } catch {
        setSnackbar({
          isOpen: true,
          status: "error",
          message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const moduleTypeLabel = {
    Case: "案件管理",
    Product: "商品管理",
    Order: "受注管理",
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <section>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Button variant="text" onClick={() => navigate('/')}>← 戻る</Button>
        <Typography variant="h5">テンプレート管理</Typography>
      </Box>

      {templates.length === 0 && !loading ? (
        <Typography>テンプレートがありません</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="template table">
            <TableHead>
              <TableRow>
                <TableCell>テンプレート名</TableCell>
                <TableCell style={{ textAlign: "center" }}>種別</TableCell>
                <TableCell style={{ textAlign: "center" }}>フィールド数</TableCell>
                <TableCell style={{ textAlign: "center" }}>作成日</TableCell>
                <TableCell style={{ textAlign: "center" }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((row) => (
                <TableRow key={row.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    {moduleTypeLabel[row.moduleType] || row.moduleType || "案件管理"}
                  </TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    {row.keywords?.length ?? 0}
                  </TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    {formatDate(row.createdDate)}
                  </TableCell>
                  <TableCell style={{ textAlign: "center" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/admin/templates/${row.id}/keywords`)}
                    >
                      フィールド管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <LoadingSpinner loading={loading} />
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default TemplateList;
