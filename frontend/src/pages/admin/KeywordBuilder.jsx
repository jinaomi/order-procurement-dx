import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import keywordService from "../../services/keywordService";
import typeService from "../../services/typeService";
import FormSnackbar from "../../components/until/FormSnackbar";
import LoadingSpinner from "../../components/until/LoadingSpinner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

const SortableRow = ({ keyword, onEdit, onHide, onRestore, onToggleUserVisibility }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: keyword.keywordId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "default",
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{
        "&:last-child td, &:last-child th": { border: 0 },
        ...(keyword.isHidden ? { bgcolor: "action.disabledBackground" } : {}),
      }}
    >
      <TableCell sx={{ width: 40, cursor: "grab", color: "text.secondary" }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" />
      </TableCell>
      <TableCell>{keyword.order}</TableCell>
      <TableCell>{keyword.keywordName}</TableCell>
      <TableCell>{keyword.typeName ?? "-"}</TableCell>
      <TableCell style={{ textAlign: "center" }}>
        {keyword.maxLength ? keyword.maxLength : "-"}
      </TableCell>
      <TableCell style={{ textAlign: "center" }}>
        {keyword.isRequired ? "✓" : ""}
      </TableCell>
      <TableCell style={{ textAlign: "center" }}>
        {keyword.isHidden ? (
          <Chip label="非表示" size="small" color="default" />
        ) : (
          <Chip label="表示中" size="small" color="success" />
        )}
      </TableCell>
      <TableCell style={{ textAlign: "center" }}>
        <Switch
          checked={keyword.isHiddenForUser ?? false}
          onChange={() => onToggleUserVisibility(keyword)}
          size="small"
          color="warning"
          disabled={keyword.isHidden}
        />
      </TableCell>
      <TableCell style={{ textAlign: "center" }}>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button variant="outlined" size="small" onClick={() => onEdit(keyword)}>
            編集
          </Button>
          {keyword.isHidden ? (
            <Button variant="outlined" size="small" color="success" onClick={() => onRestore(keyword)}>
              表示に戻す
            </Button>
          ) : (
            <Button variant="outlined" size="small" color="warning" onClick={() => onHide(keyword)}>
              非表示
            </Button>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

const emptyForm = {
  name: '',
  typeId: '',
  maxLength: '',
  isRequired: false,
  isHidden: false,
  isHiddenForUser: false,
  order: 1,
  optionsList: '',
  caseSearchable: false,
  documentSearchable: false,
  isShowOnCaseList: false,
  isShowOnTemplate: true,
};

const KeywordBuilder = () => {
  const { templateId } = useParams();
  const axiosPrivate = useAxiosPrivate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [types, setTypes] = useState([]);
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchKeywords = async () => {
    try {
      const response = await keywordService.getByTemplate(axiosPrivate, templateId);
      setKeywords(response.data ?? []);
    } catch {
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [kwRes, typeRes] = await Promise.all([
          keywordService.getByTemplate(axiosPrivate, templateId),
          typeService.getAll(axiosPrivate),
        ]);
        setKeywords(kwRes.data ?? []);
        setTypes(typeRes.data ?? []);
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
    load();
  }, []);

  const selectedTypeValue = types.find((t) => t.id === formData.typeId)?.value ?? '';
  const showOptionsList = selectedTypeValue.includes('list');

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFormData({ ...emptyForm, order: keywords.length + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (keyword) => {
    setEditTarget(keyword);
    setFormData({
      name: keyword.keywordName ?? '',
      typeId: keyword.typeId ?? '',
      maxLength: keyword.maxLength != null ? String(keyword.maxLength) : '',
      isRequired: keyword.isRequired ?? false,
      isHidden: keyword.isHidden ?? false,
      isHiddenForUser: keyword.isHiddenForUser ?? false,
      order: keyword.order ?? 1,
      optionsList: keyword.optionsList ?? '',
      caseSearchable: keyword.caseSearchable ?? false,
      documentSearchable: keyword.documentSearchable ?? false,
      isShowOnCaseList: keyword.isShowOnCaseList ?? false,
      isShowOnTemplate: keyword.isShowOnTemplate ?? true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.typeId) return;
    setLoading(true);
    try {
      if (editTarget) {
        await keywordService.update(axiosPrivate, editTarget.keywordId, {
          name: formData.name,
          typeId: formData.typeId,
          templateId: templateId,
          maxLength: formData.maxLength ? parseInt(formData.maxLength) : 0,
          isRequired: formData.isRequired,
          isHidden: formData.isHidden,
          isHiddenForUser: formData.isHiddenForUser,
          order: parseInt(formData.order),
          optionsList: formData.optionsList || null,
          caseSearchable: formData.caseSearchable,
          documentSearchable: formData.documentSearchable,
          isShowOnCaseList: formData.isShowOnCaseList,
          isShowOnTemplate: true,
        });
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "フィールドを更新しました。",
        });
      } else {
        await keywordService.create(axiosPrivate, {
          name: formData.name,
          typeId: formData.typeId,
          templateId: templateId,
          maxLength: formData.maxLength ? parseInt(formData.maxLength) : 0,
          isRequired: formData.isRequired,
          isHidden: false,
          isHiddenForUser: false,
          order: parseInt(formData.order) || (keywords.length + 1),
          optionsList: formData.optionsList || null,
          caseSearchable: formData.caseSearchable,
          documentSearchable: formData.documentSearchable,
          isShowOnCaseList: formData.isShowOnCaseList,
          isShowOnTemplate: true,
        });
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "フィールドを追加しました。",
        });
      }
      handleCloseDialog();
      await fetchKeywords();
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

  const handleHide = async (keyword) => {
    setLoading(true);
    try {
      await keywordService.softDelete(axiosPrivate, keyword.keywordId);
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "フィールドを非表示にしました。",
      });
      await fetchKeywords();
    } catch (error) {
      if (error.response?.status === 409) {
        setSnackbar({
          isOpen: true,
          status: "error",
          message: "このフィールドはケースで使用中のため非表示にできません。",
        });
      } else {
        setSnackbar({
          isOpen: true,
          status: "error",
          message: "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (keyword) => {
    setLoading(true);
    try {
      await keywordService.update(axiosPrivate, keyword.keywordId, {
        name: keyword.keywordName,
        typeId: keyword.typeId,
        templateId: templateId,
        maxLength: keyword.maxLength ?? 0,
        isRequired: keyword.isRequired ?? false,
        isHidden: false,
        isHiddenForUser: keyword.isHiddenForUser ?? false,
        order: keyword.order ?? 1,
        optionsList: keyword.optionsList || null,
        caseSearchable: keyword.caseSearchable ?? false,
        documentSearchable: keyword.documentSearchable ?? false,
        isShowOnCaseList: keyword.isShowOnCaseList ?? false,
        isShowOnTemplate: true,
      });
      setSnackbar({
        isOpen: true,
        status: "success",
        message: "フィールドを表示に戻しました。",
      });
      await fetchKeywords();
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

  const handleToggleUserVisibility = async (keyword) => {
    const newValue = !keyword.isHiddenForUser;
    setKeywords((prev) =>
      prev.map((k) => k.keywordId === keyword.keywordId ? { ...k, isHiddenForUser: newValue } : k)
    );
    try {
      await keywordService.update(axiosPrivate, keyword.keywordId, {
        name: keyword.keywordName,
        typeId: keyword.typeId,
        templateId,
        maxLength: keyword.maxLength ?? 0,
        isRequired: keyword.isRequired ?? false,
        isHidden: keyword.isHidden ?? false,
        isHiddenForUser: newValue,
        order: keyword.order ?? 1,
        optionsList: keyword.optionsList || null,
        caseSearchable: keyword.caseSearchable ?? false,
        documentSearchable: keyword.documentSearchable ?? false,
        isShowOnCaseList: keyword.isShowOnCaseList ?? false,
        isShowOnTemplate: true,
      });
    } catch {
      await fetchKeywords();
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "設定の保存に失敗しました。",
      });
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedKeywords.findIndex((k) => k.keywordId === active.id);
    const newIndex = sortedKeywords.findIndex((k) => k.keywordId === over.id);
    const reordered = arrayMove(sortedKeywords, oldIndex, newIndex).map((k, i) => ({
      ...k,
      order: i + 1,
    }));

    setKeywords(reordered);

    try {
      await keywordService.reorder(
        axiosPrivate,
        reordered.map((k) => ({ id: k.keywordId, order: k.order }))
      );
    } catch {
      await fetchKeywords();
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "並び替えの保存に失敗しました。",
      });
    }
  };

  return (
    <section>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Link to="/admin/templates" style={{ textDecoration: "none" }}>
            <Button variant="text" size="small">← テンプレート一覧</Button>
          </Link>
          <Typography variant="h5">フィールド管理</Typography>
        </Box>
        <Button variant="contained" onClick={handleOpenAdd}>
          + フィールド追加
        </Button>
      </Box>

      {sortedKeywords.length === 0 && !loading ? (
        <Typography>フィールドがありません。</Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 800 }} aria-label="keyword table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>順序</TableCell>
                  <TableCell>フィールド名</TableCell>
                  <TableCell>タイプ</TableCell>
                  <TableCell style={{ textAlign: "center" }}>最大文字数</TableCell>
                  <TableCell style={{ textAlign: "center" }}>必須</TableCell>
                  <TableCell style={{ textAlign: "center" }}>状態</TableCell>
                  <TableCell style={{ textAlign: "center" }}>ユーザーに非表示</TableCell>
                  <TableCell style={{ textAlign: "center" }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <SortableContext items={sortedKeywords.map((k) => k.keywordId)} strategy={verticalListSortingStrategy}>
                  {sortedKeywords.map((row) => (
                    <SortableRow
                      key={row.keywordId}
                      keyword={row}
                      onEdit={handleOpenEdit}
                      onHide={handleHide}
                      onRestore={handleRestore}
                      onToggleUserVisibility={handleToggleUserVisibility}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </TableContainer>
        </DndContext>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editTarget ? "フィールド編集" : "フィールド追加"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="フィールド名"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
          />
          <FormControl fullWidth required>
            <InputLabel id="type-select-label">タイプ</InputLabel>
            <Select
              labelId="type-select-label"
              label="タイプ"
              value={formData.typeId}
              onChange={(e) => handleFormChange("typeId", e.target.value)}
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="最大文字数"
            type="number"
            fullWidth
            value={formData.maxLength}
            onChange={(e) => handleFormChange("maxLength", e.target.value)}
          />
          <TextField
            label="順序"
            type="number"
            fullWidth
            value={formData.order}
            onChange={(e) => handleFormChange("order", e.target.value)}
          />
          {showOptionsList && (
            <TextField
              label="選択肢リスト"
              fullWidth
              value={formData.optionsList}
              onChange={(e) => handleFormChange("optionsList", e.target.value)}
              placeholder="選択肢A|選択肢B|選択肢C (パイプで区切る)"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isRequired}
                onChange={(e) => handleFormChange("isRequired", e.target.checked)}
              />
            }
            label="必須"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.documentSearchable}
                onChange={(e) => handleFormChange("documentSearchable", e.target.checked)}
              />
            }
            label="文書検索対象（書類管理で検索条件として表示）"
          />
          {editTarget && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isHidden}
                  onChange={(e) => handleFormChange("isHidden", e.target.checked)}
                />
              }
              label="非表示"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.typeId}
          >
            {editTarget ? "保存" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>

      <LoadingSpinner loading={loading} />
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default KeywordBuilder;
