export function groupHistoryByDate(conversations) {
  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: []
  };

  const now = new Date();
  const todayStr = now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  (conversations || []).forEach((c) => {
    const d = new Date(c.created_at || Date.now());
    const dStr = d.toDateString();

    if (dStr === todayStr) {
      groups.Today.push(c);
    } else if (dStr === yesterdayStr) {
      groups.Yesterday.push(c);
    } else if (d >= sevenDaysAgo) {
      groups["Previous 7 Days"].push(c);
    } else {
      groups.Older.push(c);
    }
  });

  return groups;
}
