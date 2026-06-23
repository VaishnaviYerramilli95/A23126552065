# Stage 1

## Notification System Design

The notification system should support placement updates, event announcements and result notifications for students.

### Core Actions

1. Create Notification
2. View All Notifications
3. View Notification By ID
4. Mark Notification As Read
5. Delete Notification
6. Receive Real-Time Notifications

---

## API Endpoints

### Create Notification

POST /api/notifications

Request Body

```json
{
  "studentId": "12345",
  "type": "Placement",
  "message": "TCS Hiring Drive Registration Started"
}
```

Response

```json
{
  "notificationId": "N001",
  "message": "Notification created successfully"
}
```

---

### Get All Notifications

GET /api/notifications

Response

```json
[
  {
    "notificationId": "N001",
    "type": "Placement",
    "message": "TCS Hiring Drive Registration Started",
    "isRead": false,
    "createdAt": "2026-06-23T10:30:00Z"
  }
]
```

---

### Get Notification By ID

GET /api/notifications/{id}

Response

```json
{
  "notificationId": "N001",
  "type": "Placement",
  "message": "TCS Hiring Drive Registration Started",
  "isRead": false
}
```

---

### Mark Notification As Read

PUT /api/notifications/{id}/read

Response

```json
{
  "message": "Notification marked as read"
}
```

---

### Delete Notification

DELETE /api/notifications/{id}

Response

```json
{
  "message": "Notification deleted successfully"
}
```

---

## Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Real-Time Notification Mechanism

For real-time updates, WebSockets can be used.

When a student logs in, a WebSocket connection is established between the client and server. Whenever a new notification is generated, the server pushes it instantly to connected users without requiring page refreshes.

### Benefits

- Faster notification delivery
- Reduced API polling
- Better user experience
- Suitable for large number of active users

# Stage 2

## Database Choice

I would use PostgreSQL because notifications have a structured format and relational databases provide reliability, indexing and efficient querying.

---

## Database Schema

### Students

```sql
CREATE TABLE Students (
    studentId VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);
```

### Notifications

```sql
CREATE TABLE Notifications (
    notificationId VARCHAR(50) PRIMARY KEY,
    studentId VARCHAR(50),
    notificationType VARCHAR(20),
    message TEXT,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES Students(studentId)
);
```

---

## Sample Queries

### Create Notification

```sql
INSERT INTO Notifications
(notificationId, studentId, notificationType, message, createdAt)
VALUES
('N001','12345','Placement','TCS Hiring Drive',NOW());
```

### Get All Notifications

```sql
SELECT * FROM Notifications
WHERE studentId='12345'
ORDER BY createdAt DESC;
```

### Get Notification By ID

```sql
SELECT * FROM Notifications
WHERE notificationId='N001';
```

### Mark Notification As Read

```sql
UPDATE Notifications
SET isRead=TRUE
WHERE notificationId='N001';
```

### Delete Notification

```sql
DELETE FROM Notifications
WHERE notificationId='N001';
```

---

## Challenges As Data Grows

1. Large notification tables can slow down queries.
2. Increased database storage usage.
3. Higher response times for fetching notifications.

---

## Solutions

1. Add indexes on studentId and createdAt.
2. Use pagination while fetching notifications.
3. Archive old notifications.
4. Partition tables based on date if data becomes very large.

### Useful Indexes

```sql
CREATE INDEX idx_student
ON Notifications(studentId);

CREATE INDEX idx_createdat
ON Notifications(createdAt);
```

# Stage 3

## Analysis of Existing Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

The query is correct because it fetches unread notifications for a particular student.

However, with millions of records it may become slow if proper indexes are not available. The database may need to scan a large number of rows before filtering and sorting the result.

---

## Improvements

Instead of indexing every column, I would create a composite index on the columns used in filtering and sorting.

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

This helps the database directly locate unread notifications for a student and return them in the required order.

---

## Why Not Index Every Column?

Adding indexes on every column is not a good idea because:

1. More storage is required.
2. Insert and update operations become slower.
3. Many indexes may never be used.
4. Database maintenance cost increases.

Indexes should only be created on frequently searched, filtered or sorted columns.

---

## Time Complexity

Without index:

```text
O(n)
```

Database may scan most rows.

With proper composite index:

```text
O(log n)
```

Lookup becomes significantly faster.

---

## Query to Find Students Who Received Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

# Stage 4

## Problem

Currently notifications are fetched from the database every time a page loads. As the number of users increases, this creates a large number of database requests and increases response time.

---

## Proposed Solutions

### 1. Caching

Store frequently accessed notifications in Redis cache.

Benefits:

- Faster response time
- Reduced database load

Tradeoff:

- Additional memory usage
- Cache invalidation needs to be handled properly

---

### 2. Pagination

Instead of loading all notifications, fetch only a limited number at a time.

Example:

```http
GET /api/notifications?page=1&limit=20
```

Benefits:

- Smaller query results
- Faster API responses

Tradeoff:

- Multiple requests may be required to view all notifications

---

### 3. Real-Time Updates

Use WebSockets so that new notifications are pushed to users instead of repeatedly fetching data from the database.

Benefits:

- Better user experience
- Reduced polling requests

Tradeoff:

- More complex implementation

---

### 4. Database Indexing

Create indexes on frequently queried columns.

```sql
CREATE INDEX idx_student_read_created
ON notifications(studentID, isRead, createdAt);
```

Benefits:

- Faster search and sorting

Tradeoff:

- Slightly slower inserts and updates

---

## Recommended Approach

I would use a combination of:

1. Redis caching
2. Pagination
3. WebSockets
4. Proper database indexing

This reduces database load while maintaining fast notification delivery and good user experience.

# Stage 5

## Problems in Existing Implementation

The current implementation processes notifications one by one.

Problems:

1. Slow for 50,000 students.
2. If email sending fails midway, some students receive notifications while others do not.
3. Database operations and email operations are tightly coupled.
4. A single failure can interrupt the entire process.
5. Poor scalability.

---

## Improved Design

I would use a message queue (RabbitMQ/Kafka/SQS) and background workers.

### Flow

1. Save notification details in the database.
2. Publish notification jobs to a queue.
3. Worker services process emails and in-app notifications independently.
4. Failed jobs are retried automatically.

This approach improves reliability and scalability.

---

## Should DB Save and Email Sending Happen Together?

No.

The notification should first be saved in the database.

Email delivery should happen asynchronously through a queue.

Reason:

- Database transaction is fast and reliable.
- Email APIs can fail or be slow.
- Failed emails can be retried without losing notification data.

---

## Revised Pseudocode

```text
function notify_all(student_ids, message):

    notification_id = save_notification(message)

    for student_id in student_ids:
        enqueue_email_job(student_id, notification_id)
        enqueue_push_job(student_id, notification_id)

worker_email():
    while job_available:
        send_email(job.student_id)

worker_push():
    while job_available:
        push_notification(job.student_id)
```

---

## Handling Failed Emails

If email delivery fails for 200 students:

1. Failed jobs remain in the queue.
2. Retry mechanism attempts delivery again.
3. After maximum retries, move failed jobs to a Dead Letter Queue (DLQ).
4. Administrators can review and resend failed notifications.

This ensures notifications are not lost and the system remains reliable.

# Stage 6

## Priority Inbox Design

The Priority Inbox should show the most important unread notifications first.

Priority is determined using:

1. Notification Type Weight
   - Placement = 3
   - Result = 2
   - Event = 1

2. Recency
   - Newer notifications get higher priority.

### Priority Score

priorityScore = typeWeight \* 100000 + timestamp

This ensures notification type has higher importance while still considering recency.

---

## Maintaining Top 10 Efficiently

Instead of sorting all notifications every time, I would use a Min Heap (Priority Queue) of size 10.

Benefits:

- O(log 10) insertion
- O(n log 10) processing
- Memory efficient
- Suitable for continuously arriving notifications

---

## JavaScript Implementation

```javascript
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
    id: "0005513a",
    type: "Result",
    message: "mid-sem",
    timestamp: "2026-04-22 17:50:54",
  },
  {
    id: "ea836726",
    type: "Result",
    message: "project-review",
    timestamp: "2026-04-22 17:50:42",
  },
  {
    id: "003cb427",
    type: "Result",
    message: "external",
    timestamp: "2026-04-22 17:50:30",
  },
  {
    id: "e5c4ff20",
    type: "Result",
    message: "project-review",
    timestamp: "2026-04-22 17:50:18",
  },
  {
    id: "1cfce5ee",
    type: "Event",
    message: "tech-fest",
    timestamp: "2026-04-22 17:50:06",
  },
  {
    id: "cf2885a6",
    type: "Result",
    message: "project-review",
    timestamp: "2026-04-22 17:49:54",
  },
  {
    id: "8a7412bd",
    type: "Placement",
    message: "Advanced Micro Devices Inc. hiring",
    timestamp: "2026-04-22 17:49:42",
  },
];

const weights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function getTopNotifications(data, limit = 10) {
  return data
    .map((n) => ({
      ...n,
      score: weights[n.type] * 100000 + new Date(n.timestamp).getTime(),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const topNotifications = getTopNotifications(notifications);

console.table(
  topNotifications.map((n) => ({
    Type: n.type,
    Message: n.message,
    Timestamp: n.timestamp,
  })),
);
```

---

## Sample Output

1. Placement - CSX Corporation hiring
2. Placement - Advanced Micro Devices Inc. hiring
3. Result - mid-sem
4. Result - mid-sem
5. Result - project-review
6. Result - external
7. Result - project-review
8. Result - project-review
9. Event - farewell
10. Event - tech-fest
