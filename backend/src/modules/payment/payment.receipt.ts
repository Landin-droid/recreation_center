import dayjs from "dayjs";
import fs from "fs";
import PDFDocument from "pdfkit";

export interface ReceiptSummary {
  receiptId: string;
  type: "payment" | "refund";
  typeLabel: string;
  status: string | null;
  statusLabel: string;
  amount: string | null;
  currency: string;
  registeredAt: string | null;
  fiscalDocumentNumber: string | null;
  fiscalStorageNumber: string | null;
  fiscalAttribute: string | null;
  fiscalProviderId: string | null;
  items: Array<{
    description: string;
    quantity: number | string;
    amount: string;
    currency: string;
  }>;
  canOpenPdf: boolean;
  pdfUrl: string | null;
}

const getReceiptTypeLabel = (type: "payment" | "refund") =>
  type === "payment" ? "Чек оплаты" : "Чек возврата";

const getReceiptStatusLabel = (status?: string | null) => {
  switch (status) {
    case "succeeded":
      return "Сформирован";
    case "pending":
      return "Формируется";
    case "canceled":
      return "Отменен";
    default:
      return status ?? "Неизвестно";
  }
};

const getCurrencySymbol = (currency: string) => {
  switch (currency.toUpperCase()) {
    case "RUB":
      return "₽";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return currency.toUpperCase();
  }
}

const formatReceiptDate = (date?: string | Date | null) =>
  date ? dayjs(date).format("DD.MM.YYYY HH:mm") : null;

const getRawItems = (rawReceipt: any) =>
  Array.isArray(rawReceipt?.items) ? rawReceipt.items : [];

const getTotalAmount = (rawReceipt: any) => {
  const items = getRawItems(rawReceipt);
  const total = items.reduce((sum, item) => {
    const value = Number(item?.amount?.value ?? 0);
    return Number.isFinite(value) ? sum + value * Number(item?.quantity ?? 1) : sum;
  }, 0);

  if (total > 0) {
    return total.toFixed(2);
  }

  return rawReceipt?.amount?.value ?? rawReceipt?.settlements?.[0]?.amount?.value ?? null;
};

export const buildReceiptSummary = (
  receipt: {
    kassaReceiptId: string;
    type: "payment" | "refund";
    status: string | null;
    rawPayload?: unknown;
  } | null,
): ReceiptSummary | null => {
  if (!receipt) {
    return null;
  }

  const rawReceipt = (receipt.rawPayload ?? {}) as any;
  const items = getRawItems(rawReceipt).map((item) => ({
    description: String(item?.description ?? "Услуга"),
    quantity: item?.quantity ?? 1,
    amount: String(item?.amount?.value ?? "0.00"),
    currency: String(item?.amount?.currency ?? "RUB"),
  }));
  const status = receipt.status ?? rawReceipt?.status ?? null;
  const canOpenPdf = status === "succeeded";

  return {
    receiptId: receipt.kassaReceiptId,
    type: receipt.type,
    typeLabel: getReceiptTypeLabel(receipt.type),
    status,
    statusLabel: getReceiptStatusLabel(status),
    amount: getTotalAmount(rawReceipt),
    currency: rawReceipt?.items?.[0]?.amount?.currency ?? "RUB",
    registeredAt: formatReceiptDate(rawReceipt?.registered_at ?? rawReceipt?.created_at),
    fiscalDocumentNumber: rawReceipt?.fiscal_document_number ?? null,
    fiscalStorageNumber: rawReceipt?.fiscal_storage_number ?? null,
    fiscalAttribute: rawReceipt?.fiscal_attribute ?? null,
    fiscalProviderId: rawReceipt?.fiscal_provider_id ?? null,
    items,
    canOpenPdf,
    pdfUrl: canOpenPdf
      ? `/api/payments/receipts/${encodeURIComponent(receipt.kassaReceiptId)}/pdf`
      : null,
  };
};

const pdfText = (value: unknown) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const findPdfFont = () => {
  const candidates = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const toPdfSafeText = (value: unknown, hasUnicodeFont: boolean) => {
  const text = pdfText(value);
  return hasUnicodeFont ? text : text.replace(/[^\x20-\x7E]/g, "?");
};

export const generateReceiptPdf = (
  summary: ReceiptSummary,
  reservation: {
    reservationId: number;
    objectName: string;
    reservationDate: Date;
    customerName: string;
    customerEmail: string;
  },
) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const fontPath = findPdfFont();
    const regularFont = fontPath ? "AppFont" : "Helvetica";
    const boldFont = fontPath ? "AppFont" : "Helvetica-Bold";

    if (fontPath) {
      doc.registerFont("AppFont", fontPath);
    }

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc
      .font(boldFont)
      .fontSize(20)
      .text(toPdfSafeText(summary.typeLabel, !!fontPath), { align: "center" });
    doc.moveDown(0.5);
    doc
      .font(regularFont)
      .fontSize(9)
      .fillColor("#6b7280")
      .text("Копия файла сгенерирована из данных чека ЮKassa", { align: "center" });
    doc.moveDown(1.5);

    doc.fillColor("#111827").font(regularFont).fontSize(11);
    const rows: Array<[string, unknown]> = [
      ["ID чека", summary.receiptId],
      ["Статус", summary.statusLabel],
      ["Тип", summary.typeLabel],
      [
        "Сумма",
        `${pdfText(summary.amount)} ${getCurrencySymbol(summary.currency)}`,
      ],
      ["Дата регистрации чека", summary.registeredAt],
      ["ID бронирования", reservation.reservationId],
      ["Объект бронирования", reservation.objectName],
      [
        "Дата бронирования",
        dayjs(reservation.reservationDate).format("DD.MM.YYYY"),
      ],
      ["Пользователь", reservation.customerName],
      ["Email пользователя", reservation.customerEmail],
      ["Номер фискального документа", summary.fiscalDocumentNumber],
      ["Фискальный накопитель", summary.fiscalStorageNumber],
      ["Фискальный атрибут", summary.fiscalAttribute],
      ["ID фискального провайдера", summary.fiscalProviderId],
    ];

    rows.forEach(([label, value]) => {
      doc.font(boldFont).text(`${label}: `, { continued: true });
      doc.font(regularFont).text(toPdfSafeText(value, !!fontPath));
    });

    doc.moveDown();
    doc.font(boldFont).fontSize(13).text("Позиции в чеке:");
    doc.moveDown(0.5);
    doc.font(regularFont).fontSize(10);

    if (summary.items.length === 0) {
      doc.text("-");
    } else {
      summary.items.forEach((item, index) => {
        doc.text(
          toPdfSafeText(
            `${index + 1}. ${item.description} | количество: ${item.quantity} | сумма: ${item.amount} ${getCurrencySymbol(item.currency)}`,
            !!fontPath,
          ),
        );
      });
    }

    doc.moveDown(1.5);
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        "Этот документ является информационной копией для учетной записи пользователя. Фискальные данные зарегистрированы через ЮKassa.",
      );

    doc.end();
  });
