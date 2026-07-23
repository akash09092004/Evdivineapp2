const { generateInvoiceNumber } = require('../utils/generateInvoiceNumber');
const Invoice = require('../models/common/Invoice');

const createInvoice = async ({ userId, paymentId, amount, gstPercent, metadata = {} }) => {
  const invoiceNumber = generateInvoiceNumber('GST');
  return Invoice.create({
    invoiceNumber,
    user: userId,
    payment: paymentId,
    amount,
    gstPercent,
    metadata
  });
};

module.exports = { createInvoice };

