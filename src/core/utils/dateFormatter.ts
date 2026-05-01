export const formatDate = (date?: string | null) => {
  return date ? new Date(date).toLocaleDateString() : "-";
};


  export const convertToISODateTime = (date: string, time: string) => {
    const isoDate = new Date(date); // YYYY-MM-DD
    const [hh, mm] = time.split(":");

    isoDate.setHours(Number(hh));
    isoDate.setMinutes(Number(mm));
    isoDate.setSeconds(0);
    isoDate.setMilliseconds(0);

    return isoDate.toISOString(); // formato date-time
  };
