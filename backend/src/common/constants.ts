import { BookableObjectType } from "../generated/prisma/client";

export const MENU_SUPPORTED_OBJECT_TYPES: BookableObjectType[] = [
  BookableObjectType.banquet_hall,
  BookableObjectType.outdoor_venue,
  BookableObjectType.karaoke_bar,
];
