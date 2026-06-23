import { Log } from "../Logging Middleware/logger.js";

const notifications = [
  {
    id: "d146095a",
    type: "Result",
    message: "mid-sem",
    timestamp: "2026-04-22 17:51:30",
  },
  {
    id: "b283218f",
    type: "Placement",
    message: "CSX Corporation hiring",
    timestamp: "2026-04-22 17:51:18",
  },
  {
    id: "81589ada",
    type: "Event",
    message: "farewell",
    timestamp: "2026-04-22 17:51:06",
  },
  {
    id: "8a7412bd",
    type: "Placement",
    message: "Advanced Micro Devices Inc. hiring",
    timestamp: "2026-04-22 17:49:42",
  },
];

const priorityWeight = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function calculatePriority(notification) {
  const weight = priorityWeight[notification.type];
  const time = new Date(notification.timestamp).getTime();

  return weight * 10000000000000 + time;
}

async function getPriorityNotifications() {
  await Log(
    "backend",
    "info",
    "service",
    "Priority notification processing started",
  );

  const sortedNotifications = [...notifications].sort(
    (a, b) => calculatePriority(b) - calculatePriority(a),
  );

  const topNotifications = sortedNotifications.slice(0, 10);

  await Log(
    "backend",
    "info",
    "service",
    "Priority notifications generated successfully",
  );

  return topNotifications;
}

async function main() {
  const result = await getPriorityNotifications();

  console.table(
    result.map((item) => ({
      Type: item.type,
      Message: item.message,
      Timestamp: item.timestamp,
    })),
  );
}

main();
