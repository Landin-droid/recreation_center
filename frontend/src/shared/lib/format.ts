export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function prettifyEnum(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const translations: Record<string, string> = {
    // Roles
    admin: "Администратор",
    staff: "Персонал",
    user: "Пользователь",

    // Reservation Statuses
    pending: "Ожидает оплаты",
    paid: "Оплачено",
    canceled: "Отменено",
    expired: "Истекло",
    refunded: "Возврат",

    // Object Types
    cottage: "Домик",
    gazebo: "Беседка",
    banquet_hall: "Банкетный зал",
    outdoor_venue: "Открытая площадка",
    karaoke_bar: "Караоке-бар",
    COTTAGE: "Домик",
    GAZEBO: "Беседка",
    BANQUET_HALL: "Банкетный зал",
    OUTDOOR_VENUE: "Открытая площадка",
    KARAOKE_BAR: "Караоке-бар",

    // Payment Statuses
    succeeded: "Успешно",
    failed: "Ошибка",
    waiting_for_capture: "Ожидает подтверждения",
    
    // Menu Categories
    food: "Еда",
    drink: "Напитки",
    snack: "Закуски",
    dessert: "Десерты",
    FOOD: "Еда",
    DRINK: "Напитки",
    SNACK: "Закуски",
    DESSERT: "Десерты",
    MAIN: "Основное блюдо",

    // Payment Methods
    bank_card: "Банковская карта",
    yoo_money: "ЮMoney",
    sberbank: "Сбербанк",
    alfa_pay: "Альфа-Пэй",
    tinkoff_bank: "Т-Банк",
    sbp: "СБП",
    cash: "Наличные",

    // Rental Categories
    ski: "Лыжи",
    tube: "Тюбинг",
    snowmobile: "Снегоход",
    skates: "Коньки",
    WINTER: "Зимний",
    SUMMER: "Летний",
    EQUIPMENT: "Снаряжение",
  };

  return translations[value] || translations[value.toLowerCase()] || value.replace(/_/g, " ");
}
