


 WITH conversation_start AS (
            SELECT
                conversationid,
                event_user_email,
            min(event_dt) AS conversation_start_time
            --     MIN(event_dt) AS conversation_start_time
            FROM o2cxdb.audit_log
            WHERE event_status = 'Conversation Started'
            GROUP BY conversationid, event_user_email
        )
        UPDATE o2cxdb.audit_log a
        SET duration_user = EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time))::INT
        FROM conversation_start cs
        WHERE 
            a.duration_user is null 
        AND	a.conversationid = cs.conversationid
        AND a.event_user_email = cs.event_user_email
        and a.conversationid is not null ;



 
    WITH conversation_start AS (
    SELECT
        conversationid,
        event_user_email,
        MIN(event_dt) AS conversation_start_time
    FROM o2cxdb.audit_log
    WHERE event_status = 'Inputs Received'
    GROUP BY conversationid, event_user_email
)
UPDATE o2cxdb.audit_log a
        SET duration_user = EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time + (a.duration * INTERVAL '1 second')))::INT
        FROM conversation_start cs

FROM o2cxdb.audit_log a
JOIN conversation_start cs
    ON a.conversationid = cs.conversationid
    AND a.event_user_email = cs.event_user_email
WHERE 
    a. IS NULL
    AND a.conversationid IS NOT NULL
    AND a.session_id IS NOT NULL
    AND a.event_dt < '2025-04-02' 
    AND a.event_dt > '2025-02-28'

    
    



Problem ONes
    2025-03-29T16:25:30


    