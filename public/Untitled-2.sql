
            
        SELECT
                count(conversationid)
            FROM o2cxdb.audit_log
            WHERE event_status = 'Conversation Started' and conversationid is not null
            
            
    	
		SELECT
               conversationid,
                event_user_email,
            min(event_dt) AS conversation_start_time
            --     MIN(event_dt) AS conversation_start_time
            FROM o2cxdb.audit_log
            WHERE event_status = 'Conversation Started' and event_dt >'2025-03-01' and event_dt <'2025-04-01' and event_type ='OVERDUE QUERY'
            GROUP BY conversationid, event_user_email 
            
                    
            --- conversation started = 4111 
            --- Input REceived = 3702
            
         
				SELECT
               conversationid,
                event_user_email,
            min(event_dt) AS conversation_start_time
            --     MIN(event_dt) AS conversation_start_time
            FROM o2cxdb.audit_log
            WHERE event_status = 'Inputs Received' and event_dt >'2025-03-01' and event_dt <'2025-04-01'  and event_type ='OVERDUE QUERY' and duration_user is null
            GROUP BY conversationid, event_user_email 
            
            
            
            select conversationid,duration,event_dt,event_status from o2cxdb.audit_log al where conversationid ='2025-03-25T15:01:25'
            
            
            
            
            select event_user_email, conversationid,duration,event_dt,event_status,event_descr, duration_user, round((EXTRACT(EPOCH FROM (event_dt - TO_TIMESTAMP(REPLACE(conversationid, 'T', ' '), 'YYYY-MM-DD HH24:MI:SS'))))) as durationuser2 from o2cxdb.audit_log al where conversationid ='2025-03-21T17:20:48'
            
            
            select event_user_email,conversationid,duration,event_dt,event_status,event_descr, duration_user, round((EXTRACT(EPOCH FROM (event_dt - TO_TIMESTAMP(REPLACE(conversationid, 'T', ' '), 'YYYY-MM-DD HH24:MI:SS'))))) as durationuser2 from o2cxdb.audit_log al where conversationid ='2024-12-02T10:43:07'
            
            
           select event_user_email,conversationid,duration,event_dt,event_status,event_descr, duration_user, 
           round((EXTRACT(EPOCH FROM (event_dt - TO_TIMESTAMP(REPLACE(conversationid, 'T', ' '), 'YYYY-MM-DD HH24:MI:SS'))))) as durationuser2 
           from o2cxdb.audit_log al where conversationid ='2024-12-04T17:08:29'
            
            
           
            select * from 
          ( select event_user_email,conversationid,duration,event_dt,event_status,event_descr, duration_user, 
           round((EXTRACT(EPOCH FROM (event_dt - TO_TIMESTAMP(REPLACE(conversationid, 'T', ' '), 'YYYY-MM-DD HH24:MI:SS'))))) as durationuser2 
           from o2cxdb.audit_log al where conversationid ='2024-12-04T17:08:29' ) as nt where nt.durationuser2 < 
            
            
           
           select * from o2cxdb.audit_log al where event_dt < '2025-04-02' and event_dt > '2025-02-28' and duration_user is null
           
           
           
           
           
           
     
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
SELECT 
    a.*,
    cs.conversation_start_time,
    EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time))::INT AS calculated_duration_user
FROM o2cxdb.audit_log a
JOIN conversation_start cs
    ON a.conversationid = cs.conversationid
    AND a.event_user_email = cs.event_user_email
WHERE 
    a.duration_user IS NULL
    AND a.conversationid IS NOT null 
    and a.event_dt < '2025-04-02' and a.event_dt > '2025-02-28' 
   
   
    
    
    
    WITH conversation_start AS (
    SELECT
        conversationid,
        event_user_email,
        MIN(event_dt) AS conversation_start_time
    FROM o2cxdb.audit_log
    WHERE event_status = 'Inputs Received'
    GROUP BY conversationid, event_user_email
)
SELECT 
    a.*,
    cs.conversation_start_time,
    EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time + (a.duration * INTERVAL '1 second')))::INT AS calculated_duration_user
FROM o2cxdb.audit_log a
JOIN conversation_start cs
    ON a.conversationid = cs.conversationid
    AND a.event_user_email = cs.event_user_email
WHERE 
	1=1
   -- a.duration_user IS NULL
    AND a.conversationid IS NOT null
    and a.session_id is not null 
    and a.session_id <> ''
    AND a.event_dt < '2025-04-02' 
    AND a.event_dt > '2025-02-28'
    and a.duration_user < -1000

    
    
   
    
    
    
    
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
FROM conversation_start  cs

WHERE 
	a.duration_user IS NULL
    AND a.conversationid IS NOT NULL
    and a.session_id is not null 
    and a.session_id <> ''
    AND a.event_dt < '2025-04-02' 
    AND a.event_dt > '2025-02-28'

    
       
    select * from o2cxdb.audit_log a where  a.event_dt < '2025-04-02' 
    AND a.event_dt > '2025-02-28'

       
           
             
           
           
           
            
            
            
            
            
            
           
            WITH conversation_start AS (
            SELECT
                conversationid,
                event_user_email,
            min(event_dt) AS conversation_start_time
            --     MIN(event_dt) AS conversation_start_time
            FROM o2cxdb.audit_log
            WHERE event_status = 'Inputs Received'
            GROUP BY conversationid, event_user_email
        )
        UPDATE o2cxdb.audit_log a
        SET duration_user = EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time + (a.duration * INTERVAL '1 second')))::INT
        FROM conversation_start cs
        WHERE 
        	a.conversationid = cs.conversationid
        AND a.event_user_email = cs.event_user_email
        AND a.conversationid IS NOT null    
        AND  a.duration_user is null
        and a.event_status <>'Conversation Started'
        and a.session_id <> ''
        and a.session_id is not null       
        AND a.event_dt < '2025-04-02' 
        AND a.event_dt > '2025-02-28'
        AND a.duration_user < -1000
        ;



EXTRACT(EPOCH FROM (a.event_dt - cs.conversation_start_time))::INT

  
    
    
   
