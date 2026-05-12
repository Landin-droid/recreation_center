import { BookableObject } from "@shared/api/types";

export const getObjectTypeName = (type: string) => {
  const types: Record<string, string> = {
    COTTAGE: "Домик",
    BANQUET_HALL: "Банкетный зал",
    GAZEBO: "Беседка",
    KARAOKE_BAR: "Караоке-бар",
    OUTDOOR_VENUE: "Открытая площадка",
  };
  return types[type.toUpperCase()] || type;
};

export const getPersonString = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return "человека";
  return "человек";
};
