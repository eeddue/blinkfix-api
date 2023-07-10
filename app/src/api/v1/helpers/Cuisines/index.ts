export const formatWorkingHours = (workingHours: { day: string; hours: { open: string; close: string } }[]) => {
  //
  const formated = workingHours.map((workingHour) => {
    const formated = {
      day: workingHour.day.toLowerCase(),
      hours: workingHour.hours,
    };
    return formated;
  });
  return formated;
};
