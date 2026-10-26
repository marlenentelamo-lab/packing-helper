const db = require('../db');

const COUNTDOWN_MILESTONES = [
    {days: 7, label: 'in 7 days' },
    {days: 3, label: 'in 3 days' },
    {days: 1, label: 'tomorrow' },
    {days: 0, label: 'today' }
];

const TASK_MILESTONES = [
    {daysOffset: 3, label: 'due in 3 days' },
    {daysOffset: 1, label: 'due tomorrow' },
    {daysOffset: 0, label: 'due today' },
    {daysOffset: -1, label: 'overdue' }
];

async function generateCountdownNotifications({ table, dateField, relatedColumn, type, userId }) {
    const relatedLabel = table === 'moves' ? 'move' : 'trip';

    for (const { days, label } of COUNTDOWN_MILESTONES) {
        await db.query(
            `INSERT INTO notifications (type, message, ${relatedColumn}, trigger_date, owner_user_id)
            SELECT $1::text, 'Your ' || $2::text || ' "' || t.name || '" is ' || $3::text || '!', t.id, CURRENT_DATE, $5
            FROM ${table} t
            WHERE t.${dateField} = CURRENT_DATE + ($4::int || ' days')::interval
            AND t.owner_user_id = $5
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.${relatedColumn} = t.id
                AND n.owner_user_id = $5
                AND n.trigger_date = CURRENT_DATE
                AND n.type = $1::text
            ) `,
            [type, relatedLabel, label, days, userId]
        );
    }
}

async function generateTaskNotifications(userId) {
    const taskType = 'task_due';

    for (const { daysOffset, label } of TASK_MILESTONES) {
        await db.query(
            `INSERT INTO notifications (type, message, related_task_id, trigger_date, owner_user_id)
            SELECT $1::text, 'Your task "' || t.task_name || '" is ' || $2::text || '!', t.id, CURRENT_DATE, $4
            FROM tasks t
            WHERE t.due_date = CURRENT_DATE + ($3::int || ' days')::interval
            AND (
                EXISTS (SELECT 1 FROM moves m WHERE m.id = t.move_id AND m.owner_user_id = $4)
                OR EXISTS (SELECT 1 FROM trips tr WHERE tr.id = t.trip_id AND tr.owner_user_id = $4)
            )
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.related_task_id = t.id
                AND n.owner_user_id = $4
                AND n.trigger_date = CURRENT_DATE
                AND n.type = $1::text
            ) `,
            [taskType, label, daysOffset, userId]
        );
    }
}

async function generateNotifications(userId) {
    await generateCountdownNotifications({
        table: 'moves',
        dateField: 'target_date',
        relatedColumn: 'related_move_id',
        type: 'move_countdown',
        userId
    });

    await generateCountdownNotifications({
        table: 'trips',
        dateField: 'trip_date',
        relatedColumn: 'related_trip_id',
        type: 'trip_countdown',
        userId
    });

    await generateTaskNotifications(userId);
}

module.exports = {
    generateNotifications,

    async getAll(req, res) {
        try {
            await generateNotifications(req.user.id);

            const { unreadOnly } = req.query;
            const whereClause = unreadOnly === 'true'
                ? 'WHERE owner_user_id = $1 AND is_read = FALSE'
                : 'WHERE owner_user_id = $1';
            const result = await db.query(
                `SELECT * FROM notifications ${whereClause} ORDER BY trigger_date DESC`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            res.status(500).json({ error: 'Failed to fetch notifications.' });
        }
    },

    async markAsRead(req, res) {
        const { id } = req.params;
        try {
            await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND owner_user_id = $2',
                [id, req.user.id]
            );
            res.json({ message: 'Notification marked as read.' });
        } catch (err) {
            console.error('Error marking notification as read:', err);
            res.status(500).json({ error: 'Failed to mark notification as read.' });
        }
    },

    async markAllAsRead(req, res) {
        try {
            await db.query(
                'UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE AND owner_user_id = $1',
                [req.user.id]
            );
            res.json({ message: 'All notifications marked as read.' });
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            res.status(500).json({ error: 'Failed to mark all notifications as read.' });
        }
    },

    async deleteNotification(req, res) {
        const { id } = req.params;
        try {
            await db.query(
                'DELETE FROM notifications WHERE id = $1 AND owner_user_id = $2',
                [id, req.user.id]
            );
            res.json({ message: 'Notification deleted.' });
        } catch (err) {
            console.error('Error deleting notification:', err);
            res.status(500).json({ error: 'Failed to delete notification.' });
        }
    }
}
