const getAll = (axiosPrivate, purchaseOrderId, supplierId, pageSize = 25, pageNumber = 1) => {
  let url = `/api/goodsReceipt/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (purchaseOrderId) {
    url += `&purchaseOrderId=${purchaseOrderId}`;
  }
  if (supplierId) {
    url += `&supplierId=${supplierId}`;
  }
  return axiosPrivate.get(url);
};

const getById = (axiosPrivate, id) => {
  return axiosPrivate.get(`/api/goodsReceipt?id=${id}`);
};

const getByPurchaseOrderId = (axiosPrivate, purchaseOrderId) => {
  return axiosPrivate.get(`/api/goodsReceipt/by-purchase-order/${purchaseOrderId}`);
};

const create = (axiosPrivate, data) => {
  return axiosPrivate.post("/api/goodsReceipt", data);
};

const extract = (axiosPrivate, file, purchaseOrderId) => {
  const formData = new FormData();
  formData.append("file", file);
  let url = "/api/goodsReceipt/extract";
  if (purchaseOrderId) {
    url += `?purchaseOrderId=${purchaseOrderId}`;
  }
  return axiosPrivate.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const goodsReceiptService = { getAll, getById, getByPurchaseOrderId, create, extract };

export default goodsReceiptService;
