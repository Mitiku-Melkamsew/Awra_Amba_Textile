export interface LogDetailItem {
  label: string;
  value: string;
}

export interface LogItem {
  id: string | number;
  when: string;
  rawDate: Date;
  who: string;
  whatHappenedTitle: string;
  whatHappenedSub: string;
  actionText: string;
  actionType: "confirmed" | "created" | "deleted" | "cancelled" | "changed" | "info";
  area: string;
  details?: LogDetailItem[];
}
