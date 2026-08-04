import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormInput from "./until/FormInput";
import CustomFieldsSection from "./until/CustomFieldsSection";
import FormSection from "./until/FormSection";
import { Grid } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import productService from "../services/productService";
import templateService from "../services/templateService";

const ProductDetail = ({ productId }) => {
  const [latestData, setLatestData] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });
  const [errors, setErrors] = useState({});
  const [dataId, setDataId] = useState();

  useEffect(async () => {
    await getCustomFields();
    await getProductDetail();
  }, []);

  const getCustomFields = async () => {
    try {
      const response = await templateService.getModuleTemplate(axiosPrivate, "Product");
      setCustomFields(response.data?.keywords || []);
    } catch (error) {
      setCustomFields([]);
    }
  };

  const getProductDetail = async () => {
    setLoading(true);
    try {
      if (productId) {
        const response = await productService.getById(axiosPrivate, productId);
        setDataId(productId);
        setLatestData(response.data);
        setCustomFieldValues(
          (response.data.customFieldValues || []).map((v) => ({
            keywordId: v.keywordId,
            value: v.value,
          }))
        );
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

  const validateForm = () => {
    let errors = {};
    if (!latestData.name) {
      errors.name = "品名は必須項目です。";
    }
    if (latestData.stockQuantity === undefined || latestData.stockQuantity === "") {
      errors.stockQuantity = "在庫数量は必須項目です。";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
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
    const payload = { ...latestData, customFieldValues };
    try {
      if (dataId) {
        await productService.update(axiosPrivate, dataId, payload);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "商品情報の更新は正常に完了しました!",
        });
      } else {
        const response = await productService.create(axiosPrivate, payload);
        setDataId(response.data);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "商品の登録は正常に完了しました！",
        });
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
    setLatestData({});
    setCustomFieldValues([]);
  };

  return (
    <section className="product">
      <form onSubmit={onSubmit}>
        <FormSection title="商品情報">
        <Grid container columnSpacing={5} rowSpacing={3}>
          <Grid item xs={6}>
            <FormInput
              label="品名"
              value={latestData.name || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, name: e.target.value }))
              }
              isRequired={true}
              className="section-input"
            >
              <errors>{errors.name}</errors>
            </FormInput>
          </Grid>
          <Grid item xs={6}>
            <FormInput
              label="品番"
              value={latestData.productCode || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, productCode: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="在庫数量"
              value={latestData.stockQuantity ?? ""}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, stockQuantity: e.target.value }))
              }
              isRequired={true}
              className="section-input"
            >
              <errors>{errors.stockQuantity}</errors>
            </FormInput>
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="単位"
              value={latestData.unitOfMeasure || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, unitOfMeasure: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="1日あたり生産能力"
              value={latestData.productionCapacityPerDay ?? ""}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({
                  ...value,
                  productionCapacityPerDay: e.target.value,
                }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="単価"
              value={latestData.unitPrice ?? ""}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, unitPrice: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={12}>
            <div className="section-item">
              <label className="section-label">備考</label>
              <textarea
                value={latestData.note || ""}
                onChange={(e) =>
                  setLatestData((value) => ({ ...value, note: e.target.value }))
                }
                className="section-input"
              ></textarea>
            </div>
          </Grid>
          <CustomFieldsSection
            fields={customFields}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />
        </Grid>
        </FormSection>
        <div className="handle-button">
          <FormButton itemName="保存" type="submit" sx={{ width: "auto", minWidth: 160 }} />
          <FormButton
            itemName="新規作成"
            buttonType="secondaryAction"
            onClick={handleClear}
            sx={{ width: "auto", minWidth: 160 }}
          />
        </div>
      </form>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default ProductDetail;
