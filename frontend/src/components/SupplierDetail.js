import { useState, useEffect } from "react";
import LoadingSpinner from "./until/LoadingSpinner";
import FormInput from "./until/FormInput";
import CustomFieldsSection from "./until/CustomFieldsSection";
import { Grid } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import supplierService from "../services/supplierService";
import templateService from "../services/templateService";

const SupplierDetail = ({ supplierId }) => {
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
    await getSupplierDetail();
  }, []);

  const getCustomFields = async () => {
    try {
      const response = await templateService.getModuleTemplate(axiosPrivate, "Supplier");
      setCustomFields(response.data?.keywords || []);
    } catch (error) {
      setCustomFields([]);
    }
  };

  const getSupplierDetail = async () => {
    setLoading(true);
    try {
      if (supplierId) {
        const response = await supplierService.getById(axiosPrivate, supplierId);
        setDataId(supplierId);
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
      errors.name = "仕入先名は必須項目です。";
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
        await supplierService.update(axiosPrivate, dataId, payload);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "仕入先情報の更新は正常に完了しました!",
        });
      } else {
        const response = await supplierService.create(axiosPrivate, payload);
        setDataId(response.data);
        setSnackbar({
          isOpen: true,
          status: "success",
          message: "仕入先の登録は正常に完了しました！",
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
    <section className="supplier">
      <form onSubmit={onSubmit}>
        <Grid container columnSpacing={5} rowSpacing={3}>
          <Grid item xs={6}>
            <FormInput
              label="仕入先名"
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
              label="担当者名"
              value={latestData.contactName || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, contactName: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={6}>
            <FormInput
              label="電話番号"
              value={latestData.phoneNumber || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, phoneNumber: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={3}>
            <FormInput
              label="郵便番号1"
              value={latestData.postCode1 || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, postCode1: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={3}>
            <FormInput
              label="郵便番号2"
              value={latestData.postCode2 || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, postCode2: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="都道府県"
              value={latestData.stateProvince || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, stateProvince: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="市区町村"
              value={latestData.city || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, city: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="町名番地"
              value={latestData.street || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, street: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={6}>
            <FormInput
              label="建物名"
              value={latestData.buildingName || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, buildingName: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={6}>
            <FormInput
              label="部屋番号"
              value={latestData.roomNumber || ""}
              type="text"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, roomNumber: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="締め日（1-31、99=月末）"
              value={latestData.closingDay ?? 99}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, closingDay: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="支払サイト（月数）"
              value={latestData.paymentCycleMonths ?? 1}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, paymentCycleMonths: e.target.value }))
              }
              className="section-input"
            />
          </Grid>
          <Grid item xs={4}>
            <FormInput
              label="支払日（1-31、99=月末）"
              value={latestData.paymentDay ?? 99}
              type="number"
              onChange={(e) =>
                setLatestData((value) => ({ ...value, paymentDay: e.target.value }))
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
          <Grid item xs={12}>
            <div className="handle-button">
              <FormButton itemName="保存" type="submit" />
              <FormButton itemName="新規作成" onClick={handleClear} />
            </div>
          </Grid>
        </Grid>
      </form>
      <LoadingSpinner loading={loading}></LoadingSpinner>
      <FormSnackbar item={snackbar} setItem={setSnackbar} />
    </section>
  );
};

export default SupplierDetail;
