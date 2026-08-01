const getAll = (
  axiosPrivate,
  supplierId,
  status,
  issueDateFrom,
  issueDateTo,
  pageSize = 25,
  pageNumber = 1
) => {
  let url = `/api/purchaseInvoice/getAll?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (supplierId) {
    url += `&supplierId=${supplierId}`;
  }
  if (status) {
    url += `&status=${status}`;
  }
  if (issueDateFrom) {
    url += `&issueDateFrom=${issueDateFrom}`;
  }
  if (issueDateTo) {
    url += `&issueDateTo=${issueDateTo}`;
  }
  return axiosPrivate.get(url);
};

const getById = (axiosPrivate, id) => {
  return axiosPrivate.get(`/api/purchaseInvoice?id=${id}`);
};

const getByPurchaseOrderId = (axiosPrivate, purchaseOrderId) => {
  return axiosPrivate.get(`/api/purchaseInvoice/by-purchase-order/${purchaseOrderId}`);
};

const create = (axiosPrivate, data) => {
  return axiosPrivate.post("/api/purchaseInvoice", data);
};

const pay = (axiosPrivate, id) => {
  return axiosPrivate.patch(`/api/purchaseInvoice/${id}/pay`);
};

const purchaseInvoiceService = { getAll, getById, getByPurchaseOrderId, create, pay };

export default purchaseInvoiceService;
