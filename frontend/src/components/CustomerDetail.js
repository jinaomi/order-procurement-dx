import { useState, useEffect } from "react";
import axios from "../api/axios";
import LoadingSpinner from "./until/LoadingSpinner";
import FormInput from "./until/FormInput";
import { useSearchParams } from "react-router-dom";
import FormSection from "./until/FormSection";
import { Grid } from "@mui/material";
import FormButton from "./until/FormButton";
import FormSnackbar from "./until/FormSnackbar";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import validator from "validator";

const CustomerDetail = ({ customerId }) => {
  const [latestData, setLatestData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const axiosPrivate = useAxiosPrivate();
  const controller = new AbortController();
  const id = searchParams.get("id");
  const [snackbar, setSnackbar] = useState({
    isOpen: false,
    status: "success",
    message: "Successfully!",
  });
  const [errors, setErrors] = useState({});
  const [dataId, setDataId] = useState();

  useEffect(async () => {
    await getCustomerDetail();
  }, []);

  const validateForm = () => {
    let errors = {};

    // Validate name field
    if (!latestData.name) {
      errors.name = "取引先名は必須項目です。";
    }

    if (!latestData.phoneNumber) {
      errors.phoneNumber = "電話番号は必須項目です。";
    } else if (!validator.isNumeric(latestData.phoneNumber)) {
      errors.phoneNumber = "電話番号は半角数字のみです";
    }

    // Set the errors and update form validity
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    // add moree event
    validateForm();
    if (!validateForm()) {
      // Form is valid, perform the submission logic
      setSnackbar({
        isOpen: true,
        status: "error",
        message: "問題が発生しました。入力内容を修正してください。",
      });
      setLoading(false);
      return;
    } else {
      // Form is invalid, display error messages
    }

    if (dataId) {
      await axiosPrivate
        .put("/api/Customer/" + dataId, latestData)
        .then((response) => {
          setSnackbar({
            isOpen: true,
            status: "success",
            message: "取引先情報の更新は正常に完了しました!",
          });
          return response;
        })
        .catch((error) => {
          if (error.response.data === "Customer is already exists.") {
            setSnackbar({
              isOpen: true,
              status: "error",
              message: "取引先はすでに存在します。重複作成はできません。",
            });
          }
        });
    } else {
      await axiosPrivate
        .post("/api/Customer", latestData)
        .then((response) => {
          setSnackbar({
            isOpen: true,
            status: "success",
            message: "取引先の登録は正常に完成しました！",
          });
          setDataId(response.data);
          return response;
        })
        .catch((error) => {
          if (error.response.data === "Customer is already exists.") {
            setSnackbar({
              isOpen: true,
              status: "error",
              message: "取引先はすでに存在します。重複作成はできません。",
            });
          }
        });
    }

    setLoading(false);
  };

  const handleClear = async () => {
    setDataId();
    var newVal = latestData;
    await Object.keys(newVal).forEach((i) => {
      setLatestData((value) => ({ ...value, [i]: "" }));
    });
    setLatestData({});
  };

  const handleAddress = async (getPostCode) => {
    setLoading(true);
    const response = await axios
      .get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${getPostCode}`)
      .catch(function () {
        setSnackbar({
          isOpen: true,
          status: "error",
          message:
            "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
        });
      });

    if (response?.data.results != null) {
      setLatestData((value) => {
        return {
          ...value,
          stateProvince: response?.data.results[0].address1,
          city:
            response?.data.results[0].address2 +
            response?.data.results[0].address3,
        };
      });
    }
    setLoading(false);
  };

  const getCustomerDetail = async () => {
    setLoading(true);
    try {
      if (customerId) {
        const response = await axiosPrivate.get(
          "/api/Customer?id=" + customerId
        );
        setDataId(customerId);
        setLatestData(response.data);
      }
    } catch (error) {
      setSnackbar({
        isOpen: true,
        status: "error",
        message:
          "エラーが発生しました。再試行するか、サポートにお問い合わせください。",
      });
    }
    setLoading(false);
  };

  return (
    <section className="customer">
      <form onSubmit={onSubmit}>
        <FormSection title="取引先情報">
        <Grid container columnSpacing={5} rowSpacing={3}>
          <Grid item xs={6}>
            <FormInput
              label="取引先名"
              value={latestData.name}
              type="text"
              onChange={(e) =>
                setLatestData((value) => {
                  return { ...value, name: e.target.value };
                })
              }
              isRequired={true}
              className="section-input"
            >
              <errors>{errors.name}</errors>
            </FormInput>
          </Grid>
          <Grid item xs={6}>
            <FormInput
              label="電話番号"
              value={latestData.phoneNumber}
              type="text"
              className="section-input"
              // required
              maxLength={11}
              onChange={(e) => {
                setLatestData((value) => {
                  return { ...value, phoneNumber: e.target.value };
                });
                // Display a message if hyphens are detected
                if (e.target.value.includes("-")) {
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    phoneNumber:
                      "「-」ハイフンを除いて番号のみを入力してください",
                  }));
                } else {
                  // Clear the error message if no hyphens
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    phoneNumber: undefined,
                  }));
                }
              }}
              isRequired={true}
            >
              <errors>{errors.phoneNumber}</errors>
            </FormInput>
          </Grid>
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">郵便番号</label>
              <div className="section-range">
                <input
                  type="text"
                  pattern="[0-9]*"
                  className="section-input"
                  name="range1"
                  value={latestData.postCode1}
                  onChange={(e) => {
                    setLatestData((value) => {
                      return { ...value, postCode1: e.target.value };
                    });

                    if (e.target.value.length === 3) {
                      const nextSibling =
                        document.querySelector(`input[name='range2']`);
                      if (nextSibling != null) {
                        setLatestData((pos) => {
                          return { ...pos, postCode2: "" };
                        });
                        nextSibling.focus();
                      }
                    }
                  }}
                  maxLength={3}
                  style={{ marginRight: 10 }}
                ></input>
                -
                <input
                  type="text"
                  className="section-input"
                  name="range2"
                  value={latestData.postCode2}
                  onChange={(e) => {
                    setLatestData((value) => {
                      return { ...value, postCode2: e.target.value };
                    });
                    if (e.target.value.length === 4) {
                      handleAddress(latestData.postCode1 + e.target.value);
                    }
                  }}
                  pattern="[0-9]*"
                  maxLength={4}
                  style={{ marginLeft: 10 }}
                ></input>
              </div>
            </div>
            <div className="section-item">
              <label className="section-label">都道府県</label>
              <input
                type="text"
                className="section-input"
                value={latestData.stateProvince}
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, stateProvince: e.target.value };
                  })
                }
              ></input>
            </div>
            <div className="section-item">
              <label className="section-label">市区町村</label>
              <input
                value={latestData.city}
                type="text"
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, city: e.target.value };
                  })
                }
                className="section-input"
              ></input>
            </div>
          </Grid>
          <Grid item xs={6}>
            <div className="section-item">
              <label className="section-label">丁目・番地・号</label>
              <input
                value={latestData.street}
                type="text"
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, street: e.target.value };
                  })
                }
                className="section-input"
              ></input>
            </div>
            <div className="section-item">
              <label className="section-label">建物名</label>
              <input
                value={latestData.buildingName}
                type="text"
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, buildingName: e.target.value };
                  })
                }
                className="section-input"
              ></input>
            </div>
            <div className="section-item">
              <label className="section-label">部屋番号</label>
              <input
                value={latestData.roomNumber}
                type="text"
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, roomNumber: e.target.value };
                  })
                }
                className="section-input"
              ></input>
            </div>
          </Grid>
          <Grid item xs={12}>
            <div className="section-item">
              <label className="section-label">備考</label>
              <textarea
                value={latestData.note}
                onChange={(e) =>
                  setLatestData((value) => {
                    return { ...value, note: e.target.value };
                  })
                }
                className="section-input"
              ></textarea>
            </div>
          </Grid>
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

export default CustomerDetail;
