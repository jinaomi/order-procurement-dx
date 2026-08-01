const getAll = (
  axiosPrivate,
  status,
  supplierId,
  orderDateFrom,
  orderDateTo,
  pageSize = 25,
  pageNumber = 1
) => {
  let url = `/api/purchaseOrder/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (status) {
    url += `&status=${status}`;
  }
  if (supplierId) {
    url += `&supplierId=${supplierId}`;
  }
  if (orderDateFrom) {
    url += `&orderDateFrom=${orderDateFrom}`;
  }
  if (orderDateTo) {
    url += `&orderDateTo=${orderDateTo}`;
  }
  return axiosPrivate.get(url);
};

const getById = (axiosPrivate, id) => {
  return axiosPrivate.get(`/api/purchaseOrder?id=${id}`);
};

const create = (axiosPrivate, data) => {
  return axiosPrivate.post("/api/purchaseOrder", data);
};

const update = (axiosPrivate, id, data) => {
  return axiosPrivate.put(`/api/purchaseOrder/${id}`, data);
};

const updateStatus = (axiosPrivate, id, status) => {
  return axiosPrivate.put(`/api/purchaseOrder/status?id=${id}&status=${status}`);
};

const deleteById = (axiosPrivate, id) => {
  return axiosPrivate.delete(`/api/purchaseOrder/${id}`);
};

const getReconciliation = (axiosPrivate, id) => {
  return axiosPrivate.get(`/api/purchaseOrder/${id}/reconciliation`);
};

const extract = (axiosPrivate, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosPrivate.post("/api/purchaseOrder/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const purchaseOrderService = { getAll, getById, create, update, updateStatus, deleteById, getReconciliation, extract };

export default purchaseOrderService;
